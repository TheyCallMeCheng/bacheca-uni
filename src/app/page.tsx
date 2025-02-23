'use client';

import { useState, useEffect } from "react";
import Feed from "@/components/Feed";
import CreatePost from "@/components/CreatePost";
import PostCard from '@/components/PostCard';
import { supabase } from "@/lib/supabase";

// Update Post type to match database schema
type Post = {
    id: string;
    created_at: string;
    title: string;
    content: string;
    author_id?: string;
    media_url?: string;
    media_type?: 'image' | 'video';
    tags: string[];
};

export default function Home() {
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);

    useEffect(() => {
        const fetchPosts = async () => {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching posts:', error);
                return;
            }

            setPosts(data);
        };

        fetchPosts();

        // Subscribe to real-time changes
        const subscription = supabase
            .channel('posts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' },
                payload => {
                    if (payload.eventType === 'INSERT') {
                        setPosts(posts => [payload.new as Post, ...posts]);
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);


    const handleCreatePost = async (newPost: {
        title: string;
        content: string;
        media?: File;
        tags: string[];
    }) => {
        try {
            let mediaUrl = null;
            let mediaType = null;

            // If there's media, upload it to Supabase Storage
            if (newPost.media) {
                let fileToUpload = newPost.media;
                const isImage = newPost.media.type.startsWith('image');

                // Compress image if it's an image file
                if (isImage) {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();

                    // Convert to promise to handle image loading
                    await new Promise((resolve) => {
                        img.onload = resolve;
                        if (newPost.media) {
                            img.src = URL.createObjectURL(newPost.media);
                        }
                    });

                    // Set max dimensions while maintaining aspect ratio
                    const MAX_WIDTH = 1200;
                    const MAX_HEIGHT = 1200;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx?.drawImage(img, 0, 0, width, height);

                    // Convert to blob with reduced quality
                    const blob = await new Promise<Blob>((resolve) =>
                        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.7)
                    );

                    fileToUpload = new File([blob], newPost.media.name, {
                        type: 'image/jpeg'
                    });
                }

                const fileExt = fileToUpload.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const { data, error } = await supabase.storage
                    .from('post-media')
                    .upload(fileName, fileToUpload);

                if (error) throw error;

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('post-media')
                    .getPublicUrl(fileName);

                mediaUrl = publicUrl;
                mediaType = isImage ? 'image' : 'video';
            }

            // Fix auth.user() call
            const { data: { user } } = await supabase.auth.getUser();

            // Insert post into database
            const { data, error } = await supabase
                .from('posts')
                .insert({
                    title: newPost.title,
                    content: newPost.content,
                    media_url: mediaUrl,
                    media_type: mediaType,
                    tags: newPost.tags,
                    author_id: user?.id
                })
                .select()
                .single();

            if (error) throw error;

            // Update local state
            setPosts(prevPosts => [data, ...prevPosts]);
            setIsCreatePostOpen(false);
        } catch (error) {
            console.error('Error creating post:', error);
            // Handle error (show toast notification, etc.)
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 scrollbar-custom">
            <header className="sticky top-0 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 shadow-sm z-40">
                <h1 className="text-4xl font-bold text-center py-6 font-sans italic tracking-tight text-gray-800 dark:text-gray-100">
                    LA BACHECA
                </h1>
            </header>

            <button
                className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 ease-in-out hover:scale-110 z-50"
                onClick={() => setIsCreatePostOpen(true)}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <Feed posts={posts} />
            </div>

            <CreatePost
                isOpen={isCreatePostOpen}
                onClose={() => setIsCreatePostOpen(false)}
                onSubmit={handleCreatePost}
            />
        </main>
    );
}
