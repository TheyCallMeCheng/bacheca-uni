type PostCardProps = {
    id: string;
    title: string;
    content: string;
    created_at: string;
    media?: {
        url: string;
        type: 'image' | 'video';
    };
    tags: string[];
    commentCount?: number;
    onOpenComments: (postId: string) => void;
};

export default function PostCard({
    id,
    title,
    content,
    created_at,
    media,
    tags,
    commentCount = 0,
    onOpenComments
}: PostCardProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4 snap-start">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold">{title}</h2>
                <span className="text-sm text-gray-500">{new Date(created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300">{content}</p>
            {/* Display media if present */}
            {media && (
                <div className="mt-4">
                    {media.type === 'image' ? (
                        <>
                            <img
                                src={media.url}
                                alt={title}
                                className="w-full rounded-lg cursor-pointer"
                                onClick={(e) => {
                                    const modal = document.createElement('div');
                                    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
                                    modal.onclick = () => document.body.removeChild(modal);

                                    const img = document.createElement('img');
                                    img.src = media.url;
                                    img.className = 'max-h-[90vh] max-w-[90vw] object-contain';

                                    modal.appendChild(img);
                                    document.body.appendChild(modal);
                                }}
                            />
                        </>
                    ) : (
                        <video
                            src={media.url}
                            controls
                            className="w-full rounded-lg"
                        />
                    )}
                </div>
            )}

            {/* Display tags */}
            <div className="flex flex-wrap gap-2 mt-4">
                {tags.map((tag, index) => (
                    <span
                        key={index}
                        className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full text-sm"
                    >
                        {tag}
                    </span>
                ))}
            </div>

            {/* Post actions */}
            <div className="flex items-center mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => onOpenComments(id)}
                    className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span>{commentCount > 0 ? `${commentCount} comments` : 'Comment'}</span>
                </button>
            </div>
        </div>
    );
} 