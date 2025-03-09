"use client"

import { useState, useEffect } from "react"
import Feed from "@/components/Feed"
import BottomMenu from "@/components/BottomMenu"
import { supabase } from "@/lib/supabase"

// Update Post type to match database schema
type Post = {
    id: string
    created_at: string
    title: string
    content: string
    author_id?: string
    media_url?: string
    media_type?: "image" | "video"
    tags: string[]
}

export default function Home() {
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
    const [posts, setPosts] = useState<Post[]>([])

    useEffect(() => {
        const fetchPosts = async () => {
            const { data, error } = await supabase
                .from("posts")
                .select("*")
                .order("created_at", { ascending: false })

            if (error) {
                console.error("Error fetching posts:", error)
                return
            }

            setPosts(data)
        }

        fetchPosts()

        // Subscribe to real-time changes
        const subscription = supabase
            .channel("posts")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "posts" },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        setPosts((posts) => [payload.new as Post, ...posts])
                    }
                }
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const handleCreatePost = async (newPost: {
        title: string
        content: string
        media?: File
        tags: string[]
    }) => {
        try {
            let mediaUrl = null
            let mediaType = null

            // If there's media, upload it to Supabase Storage
            if (newPost.media) {
                let fileToUpload = newPost.media
                const isImage = newPost.media.type.startsWith("image")

                // Compress image if it's an image file
                if (isImage) {
                    const canvas = document.createElement("canvas")
                    const ctx = canvas.getContext("2d")
                    const img = new Image()

                    // Convert to promise to handle image loading
                    await new Promise((resolve) => {
                        img.onload = resolve
                        if (newPost.media) {
                            img.src = URL.createObjectURL(newPost.media)
                        }
                    })

                    // Set max dimensions while maintaining aspect ratio
                    const MAX_WIDTH = 1200
                    const MAX_HEIGHT = 1200
                    let width = img.width
                    let height = img.height

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width
                            width = MAX_WIDTH
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height
                            height = MAX_HEIGHT
                        }
                    }

                    canvas.width = width
                    canvas.height = height
                    ctx?.drawImage(img, 0, 0, width, height)

                    // Convert to blob with reduced quality
                    const blob = await new Promise<Blob>((resolve) =>
                        canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.7)
                    )

                    fileToUpload = new File([blob], newPost.media.name, {
                        type: "image/jpeg",
                    })
                }

                const fileExt = fileToUpload.name.split(".").pop()
                const fileName = `${Math.random()}.${fileExt}`
                const { data, error } = await supabase.storage
                    .from("post-media")
                    .upload(fileName, fileToUpload)

                if (error) throw error

                // Get public URL
                const {
                    data: { publicUrl },
                } = supabase.storage.from("post-media").getPublicUrl(fileName)

                mediaUrl = publicUrl
                mediaType = isImage ? "image" : "video"
            }

            // Fix auth.user() call
            const {
                data: { user },
            } = await supabase.auth.getUser()

            // Insert post into database
            const { data, error } = await supabase
                .from("posts")
                .insert({
                    title: newPost.title,
                    content: newPost.content,
                    media_url: mediaUrl,
                    media_type: mediaType,
                    tags: newPost.tags,
                    author_id: user?.id,
                })
                .select()
                .single()

            if (error) throw error

            // Update local state
            setPosts((prevPosts) => [data, ...prevPosts])
            setIsCreatePostOpen(false)
        } catch (error) {
            console.error("Error creating post:", error)
            // Handle error (show toast notification, etc.)
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
            <main className="flex-1 pb-16">
                <div className="container mx-auto max-w-4xl">
                    <Feed
                        posts={posts}
                        onCreatePost={handleCreatePost}
                    />
                </div>
            </main>
            <BottomMenu onCreatePost={handleCreatePost} />
        </div>
    )
}
