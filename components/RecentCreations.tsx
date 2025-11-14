import React from 'react';
import type { Meme } from '../types';

interface RecentCreationsProps {
    memes: Meme[];
    onMemeClick: (meme: Meme) => void;
}

const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const RecentCreations: React.FC<RecentCreationsProps> = ({ memes, onMemeClick }) => {
    if (memes.length === 0) {
        return null;
    }

    return (
        <div className="w-full max-w-6xl mt-16">
            <h2 className="text-2xl font-bold text-center mb-8 border-t border-gray-700 pt-8">Latest Creations on the 'Chain'</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {memes.map((meme) => (
                    <div
                        key={meme.id}
                        onClick={() => onMemeClick(meme)}
                        className="cursor-pointer group block bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-indigo-500 transition-all duration-300"
                    >
                        <div className="aspect-square">
                           <img src={meme.imageUrl} alt="Recent Meme" className="w-full h-full object-cover" />
                        </div>
                        <div className="p-3 space-y-1">
                            {/* YENİ: Creator Name */}
                            <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-300">
                                {meme.creatorName}
                            </p>
                            {/* YENİ: Creation Time */}
                            <p className="text-xs text-gray-500">
                                {formatTimestamp(meme.createdAt)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};