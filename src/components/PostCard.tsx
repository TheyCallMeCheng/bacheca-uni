type PostCardProps = {
    title: string;
    content: string;
    created_at: string;
    media?: {
        url: string;
        type: 'image' | 'video';
    };
    tags: string[];
};

export default function PostCard({ title, content, created_at, media, tags }: PostCardProps) {
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
        </div>
    );
} 