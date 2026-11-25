'use client';

import { useState } from 'react';

export default function BlogImage({
    post,
    className = '',
    imgClassName = '',
    emojiClassName = 'text-6xl sm:text-7xl',
    priority = false,
}) {
    const [imgError, setImgError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const hasRealImage = Boolean(post?.image) && !imgError;

    return (
        <div
            className={`relative overflow-hidden bg-gradient-to-br ${post?.cover || 'from-blue-50 via-sky-50 to-indigo-100'
                } ${className}`}
        >
            {hasRealImage ? (
                <>
                    {/* Subtle loading shimmer jab tak image load ho */}
                    {!isLoaded && (
                        <div className="absolute inset-0 animate-pulse bg-white/30" />
                    )}
                    <img
                        src={post.image}
                        alt={post.imageAlt || post.title}
                        loading={priority ? 'eager' : 'lazy'}
                        decoding="async"
                        onLoad={() => setIsLoaded(true)}
                        onError={() => setImgError(true)}
                        className={`h-full w-full transform-gpu object-cover transition-all duration-500 ease-out ${isLoaded ? 'scale-100 opacity-100' : 'scale-[1.02] opacity-0'
                            } ${imgClassName}`}
                    />
                </>
            ) : (
                <div
                    className={`grid h-full w-full place-items-center select-none ${emojiClassName}`}
                >
                    <span className="transform-gpu transition-transform duration-300 ease-out group-hover:scale-110">
                        {post?.emoji || '🧸'}
                    </span>
                </div>
            )}
        </div>
    );
}