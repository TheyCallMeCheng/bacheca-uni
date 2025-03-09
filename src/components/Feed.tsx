'use client';

import { useState } from 'react';
import PostCard from './PostCard';
import { useRouter } from 'next/navigation';

type Post = {
    id: string;
    created_at: string;
    title: string;
    content: string;
    author_id?: string;
    media_url?: string;
    media_type?: 'image' | 'video';
    tags: string[];
    comment_count?: number;
};

type FeedProps = {
    posts: Post[];
    onCreatePost: (post: {
        title: string;
        content: string;
        media?: File;
        tags: string[];
    }) => Promise<void>;
};

export default function Feed({ posts, onCreatePost }: FeedProps) {
    const router = useRouter();

    const handleOpenComments = (postId: string) => {
        router.push(`/post/${postId}`);
    };

    return (
        <div className="max-w-md mx-auto bg-white dark:bg-gray-900">
            {posts.map((post, index) => (
                <div
                    key={post.id}
                    className={`${index !== posts.length - 1 ? 'mb-4' : 'mb-6'}`}
                >
                    <PostCard
                        id={post.id}
                        title={post.title}
                        content={post.content}
                        created_at={post.created_at}
                        media={post.media_url ? {
                            url: post.media_url,
                            type: post.media_type || 'image'
                        } : undefined}
                        tags={post.tags}
                        commentCount={post.comment_count || 0}
                        onOpenComments={handleOpenComments}
                    />
                </div>
            ))}
        </div>
    );
} 