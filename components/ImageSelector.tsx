
import React, { useRef } from 'react';
import { TEMPLATE_MEMES } from '../constants';
import { UploadIcon } from './icons';

interface ImageSelectorProps {
    onImageSelect: (imageBase64: string) => void;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

export const ImageSelector: React.FC<ImageSelectorProps> = ({ onImageSelect }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const base64 = await fileToBase64(file);
            onImageSelect(base64);
        }
    };
    
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleTemplateClick = async (url: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const file = new File([blob], "template.jpg", { type: blob.type });
            const base64 = await fileToBase64(file);
            onImageSelect(base64);
        } catch (error) {
            console.error("Error fetching template image:", error);
        }
    };


    return (
        <div className="w-full max-w-4xl text-center p-8 bg-gray-800/50 rounded-2xl border border-gray-700 shadow-2xl">
            <h2 className="text-3xl font-bold mb-2 text-indigo-300">Create Your Meme</h2>
            <p className="text-lg text-gray-400 mb-8">Start by uploading an image or choosing a popular template.</p>
            
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />
            <button
                onClick={handleUploadClick}
                className="w-full md:w-auto inline-flex items-center justify-center px-8 py-4 mb-8 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-105"
            >
                <UploadIcon className="w-6 h-6 mr-3" />
                Upload Your Image
            </button>

            <h3 className="text-xl font-semibold mb-6 border-t border-gray-700 pt-6">Or select a trending template</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {TEMPLATE_MEMES.map((meme) => (
                    <div
                        key={meme.name}
                        onClick={() => handleTemplateClick(meme.url)}
                        className="cursor-pointer group aspect-square bg-gray-700 rounded-lg overflow-hidden relative transform hover:scale-105 transition-transform duration-300"
                    >
                        <img src={meme.url} alt={meme.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                            <span className="text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">{meme.name}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
