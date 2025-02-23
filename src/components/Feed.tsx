'use client';

import PostCard from './PostCard';

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

type FeedProps = {
    posts: Post[];
};

export default function Feed({ posts }: FeedProps) {
    return (
        <div className="max-w-md mx-auto h-screen overflow-y-auto snap-y snap-mandatory">
            {posts.map((post) => (
                <PostCard
                    key={post.id}
                    title={post.title}
                    content={post.content}
                    created_at={post.created_at}
                    media={post.media_url ? {
                        url: post.media_url,
                        type: post.media_type || 'image'
                    } : undefined}
                    tags={post.tags}
                />
            ))}
        </div>
    );
} 