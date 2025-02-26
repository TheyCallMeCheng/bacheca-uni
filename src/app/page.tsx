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
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
            <main className="flex-1 pb-16">
                <div className="container mx-auto max-w-4xl">
                    <Feed posts={posts} />
                </div>

                <CreatePost
                    isOpen={isCreatePostOpen}
                    onClose={() => setIsCreatePostOpen(false)}
                    onSubmit={handleCreatePost}
                />
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg flex justify-around items-center p-4 h-16">
                <button
                    onClick={() => window.location.href = '/'}
                    className="flex flex-col items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="text-sm">Home</span>
                </button>
                <button
                    onClick={() => setIsCreatePostOpen(true)}
                    className="flex items-center justify-center text-white bg-indigo-500 hover:bg-indigo-600 rounded-full w-16 h-16 -mt-8 shadow-lg relative"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
                <button className="flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-3.31 0-10 1.67-10 5v2h20v-2c0-3.33-6.69-5-10-5z" />
                    </svg>
                    <span className="text-sm">Account</span>
                </button>
            </nav>
        </div>
    );
}
