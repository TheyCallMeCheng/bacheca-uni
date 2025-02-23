'use client';

import { useState } from 'react';
import Image from 'next/image';

interface CreatePostProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (post: {
        title: string;
        content: string;
        media?: File;
        tags: string[];
    }) => void;
}

export default function CreatePost({ isOpen, onClose, onSubmit }: CreatePostProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [media, setMedia] = useState<File | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (media) {
            onSubmit({ title, content, media, tags });
        } else {
            onSubmit({ title, content, tags });
        }
        resetForm();
    };

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const resetForm = () => {
        setTitle('');
        setContent('');
        setMedia(null);
        setTags([]);
        setTagInput('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-lg">
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Create New Post</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Title Input */}
                    <input
                        type="text"
                        placeholder="Post title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:border-gray-600"
                        required
                    />

                    {/* Content Input */}
                    <textarea
                        placeholder="What's on your mind?"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full p-2 mb-4 border rounded h-32 resize-none dark:bg-gray-700 dark:border-gray-600"
                        required
                    />

                    {/* Media Upload */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                            Add Media (optional)
                        </label>
                        <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) => setMedia(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-gray-500 dark:text-gray-400
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100
                            dark:file:bg-blue-900 dark:file:text-blue-200"
                        />
                    </div>

                    {/* Tags Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                            Tags (press Enter to add)
                        </label>
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleAddTag}
                            placeholder="Add tags..."
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                            {tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full text-sm flex items-center"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => setTags(tags.filter((_, i) => i !== index))}
                                        className="ml-2 text-xs"
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-500 hover:text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Post
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 