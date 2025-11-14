
import React from 'react';
import { SparklesIcon } from './icons';

interface LoaderProps {
    message: string;
}

export const Loader: React.FC<LoaderProps> = ({ message }) => {
    return (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-80 flex flex-col items-center justify-center z-20 rounded-2xl">
            <SparklesIcon className="w-12 h-12 text-indigo-400 animate-pulse mb-4" />
            <p className="text-lg font-semibold text-white">{message}</p>
        </div>
    );
};
