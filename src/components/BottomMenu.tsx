"use client"

import { useState } from "react"
import CreatePost from "./CreatePost"

export default function BottomMenu({
    onCreatePost,
}: {
    onCreatePost: (post: {
        title: string
        content: string
        media?: File
        tags: string[]
    }) => Promise<void>
}) {
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg flex justify-around items-center p-4 h-16">
                <button
                    onClick={() => (window.location.href = "/")}
                    className="flex flex-col items-center"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                    </svg>
                    <span className="text-sm">Home</span>
                </button>
                <button
                    onClick={() => setIsCreatePostOpen(true)}
                    className="flex items-center justify-center text-white bg-indigo-500 hover:bg-indigo-600 rounded-full w-16 h-16 -mt-8 shadow-lg relative"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                </button>
                <button
                    onClick={() => (window.location.href = "/account")}
                    className="flex flex-col items-center"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-3.31 0-10 1.67-10 5v2h20v-2c0-3.33-6.69-5-10-5z"
                        />
                    </svg>
                    <span className="text-sm">Account</span>
                </button>
            </nav>

            <CreatePost
                isOpen={isCreatePostOpen}
                onClose={() => setIsCreatePostOpen(false)}
                onSubmit={onCreatePost}
            />
        </>
    )
}
