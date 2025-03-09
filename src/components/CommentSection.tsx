'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import BottomMenu from './BottomMenu';

type Post = {
    id: string;
    title: string;
    content: string;
    created_at: string;
    author_id?: string;
    media_url?: string;
    media_type?: 'image' | 'video';
    tags: string[];
};

type Comment = {
    id: string;
    created_at: string;
    content: string;
    author_id: string;
    post_id: string;
    parent_id: string | null;
    author_name?: string;
    replies?: Comment[];
};

type CommentSectionProps = {
    postId: string;
    isOpen: boolean;
    onClose: () => void;
    onCreatePost: (post: {
        title: string;
        content: string;
        media?: File;
        tags: string[];
    }) => Promise<void>;
};

export default function CommentSection({ postId, isOpen, onClose, onCreatePost }: CommentSectionProps) {
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState<Comment | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchPost();
            fetchComments();
        }
    }, [isOpen, postId]);

    const fetchPost = async () => {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('id', postId)
                .single();

            if (error) throw error;
            setPost(data);
        } catch (error) {
            console.error('Error fetching post:', error);
        }
    };

    const fetchComments = async () => {
        setLoading(true);
        try {
            // First, fetch all comments for this post
            const { data: commentsData, error: commentsError } = await supabase
                .from('comments')
                .select('*')
                .eq('post_id', postId)
                .order('created_at', { ascending: true });

            if (commentsError) throw commentsError;

            // Get unique author IDs
            const authorIds = [...new Set(commentsData.map(comment => comment.author_id))];

            // Fetch author profiles separately
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, username, avatar_url')
                .in('id', authorIds);

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
                // Continue with anonymous profiles
            }

            // Create a map of author profiles
            const profilesMap = new Map();
            if (profilesData) {
                profilesData.forEach(profile => {
                    profilesMap.set(profile.id, profile);
                });
            }

            // Organize comments into a tree structure
            const commentMap = new Map<string, Comment>();
            const rootComments: Comment[] = [];

            // First pass: create all comment objects with author info
            commentsData.forEach((comment: any) => {
                const profile = profilesMap.get(comment.author_id);
                commentMap.set(comment.id, {
                    ...comment,
                    author_name: comment.author_name || (profile ? profile.username : 'Anonymous'),
                    replies: []
                });
            });

            // Second pass: organize into tree
            commentsData.forEach((comment: any) => {
                const commentObj = commentMap.get(comment.id)!;

                if (comment.parent_id) {
                    // This is a reply
                    const parent = commentMap.get(comment.parent_id);
                    if (parent && parent.replies) {
                        parent.replies.push(commentObj);
                    }
                } else {
                    // This is a root comment
                    rootComments.push(commentObj);
                }
            });

            setComments(rootComments);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitComment = async () => {
        if (!newComment.trim()) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in to comment');

            const { data, error } = await supabase
                .from('comments')
                .insert({
                    content: newComment.trim(),
                    post_id: postId,
                    author_id: user.id,
                    parent_id: replyTo?.id || null
                })
                .select()
                .single();

            if (error) throw error;

            // Refresh comments
            fetchComments();
            setNewComment('');
            setReplyTo(null);
        } catch (error) {
            console.error('Error posting comment:', error);
            // Show error notification
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 shadow-md z-10">
                <div className="flex justify-between items-center p-4 max-w-md mx-auto">
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h2 className="text-xl font-bold">Comments</h2>
                    <div className="w-6"></div> {/* Empty div for flex spacing */}
                </div>
            </div>

            {/* Main content area with post and comments */}
            <div className="flex-1 overflow-y-auto pb-16"> {/* Add padding for bottom menu */}
                <div className="max-w-md mx-auto">
                    {/* Post content */}
                    {post && (
                        <div className="bg-white dark:bg-gray-800 p-4 mb-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-xl font-bold">{post.title}</h2>
                                <span className="text-sm text-gray-500">{new Date(post.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300">{post.content}</p>

                            {/* Display media if present */}
                            {post.media_url && (
                                <div className="mt-4">
                                    {post.media_type === 'image' ? (
                                        <img
                                            src={post.media_url}
                                            alt={post.title}
                                            className="w-full rounded-lg"
                                        />
                                    ) : (
                                        <video
                                            src={post.media_url}
                                            controls
                                            className="w-full rounded-lg"
                                        />
                                    )}
                                </div>
                            )}

                            {/* Display tags */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                {post.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full text-sm"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Comments section */}
                    <div className="p-4">
                        <h3 className="text-lg font-semibold mb-4">
                            {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
                        </h3>

                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {comments.map(comment => (
                                    <CommentItem
                                        key={comment.id}
                                        comment={comment}
                                        onReply={setReplyTo}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Reply indicator */}
            {replyTo && (
                <div className="bg-gray-100 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                    <div className="max-w-md mx-auto px-4 py-2 flex justify-between items-center">
                        <span className="text-sm">
                            Replying to <span className="font-medium">{replyTo.author_name}</span>
                        </span>
                        <button
                            onClick={() => setReplyTo(null)}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Comment input */}
            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky  z-10"> {/* Position above bottom menu */}
                <div className="max-w-md mx-auto ">
                    <div className="flex">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
                            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-l-lg px-4  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                        <button
                            onClick={handleSubmitComment}
                            disabled={!newComment.trim()}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg disabled:opacity-50"
                        >
                            Post
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Menu */}
        </div>
    );
}

// Comment item component with nested replies
function CommentItem({ comment, onReply, depth = 0 }: { comment: Comment; onReply: (comment: Comment) => void; depth?: number }) {
    const [showReplies, setShowReplies] = useState(true);
    const maxDepth = 5; // Limit nesting depth for UI clarity

    return (
        <div className={`${depth > 0 ? 'ml-6 pl-4 border-l-2 border-gray-200 dark:border-gray-700' : ''}`}>
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-sm font-medium">{comment.author_name?.[0]?.toUpperCase() || 'A'}</span>
                    </div>
                </div>
                <div className="flex-1">
                    <div className="flex items-center space-x-2">
                        <span className="font-medium">{comment.author_name}</span>
                        <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleString()}
                        </span>
                    </div>
                    <p className="mt-1 text-gray-800 dark:text-gray-200">{comment.content}</p>
                    <div className="mt-2">
                        <button
                            onClick={() => onReply(comment)}
                            className="text-sm text-gray-500 hover:text-blue-500 dark:hover:text-blue-400"
                        >
                            Reply
                        </button>
                    </div>
                </div>
            </div>

            {/* Nested replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3">
                    <button
                        onClick={() => setShowReplies(!showReplies)}
                        className="text-sm text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 mb-2 flex items-center"
                    >
                        {showReplies ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                Hide replies
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                            </>
                        )}
                    </button>

                    {showReplies && (
                        <div className="space-y-4">
                            {comment.replies.map(reply => (
                                depth < maxDepth ? (
                                    <CommentItem
                                        key={reply.id}
                                        comment={reply}
                                        onReply={onReply}
                                        depth={depth + 1}
                                    />
                                ) : (
                                    <div key={reply.id} className="ml-6 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                        <div className="flex items-start space-x-3">
                                            <div className="flex-shrink-0">
                                                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                                    <span className="text-sm font-medium">{reply.author_name?.[0]?.toUpperCase() || 'A'}</span>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium">{reply.author_name}</span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(reply.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-gray-800 dark:text-gray-200">{reply.content}</p>
                                                <div className="mt-2">
                                                    <button
                                                        onClick={() => onReply(reply)}
                                                        className="text-sm text-gray-500 hover:text-blue-500 dark:hover:text-blue-400"
                                                    >
                                                        Reply
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 