import React from 'react';
import type { Meme } from '../types';
import { CloseIcon, ExternalLinkIcon } from './icons';

interface ImageModalProps {
    meme: Meme;
    onClose: () => void;
}

const SOLSCAN_URL = 'https://solscan.io/tx/'; // İşlem imzasına bakmak için tx kullanıyoruz
const SOLSCAN_PARAMS = '?cluster=custom&customUrl=https://rpc.testnet.carv.io/rpc';

const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Resmi indirme fonksiyonu
const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const ImageModal: React.FC<ImageModalProps> = ({ meme, onClose }) => {
    
    const handleDownload = () => {
        downloadImage(meme.imageUrl, `carvux_meme_${meme.creatorName.replace(/\s/g, '_')}_${meme.id}.jpeg`);
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl max-w-3xl w-full relative transform transition-all duration-300 scale-95 animate-scale-in"
                onClick={(e) => e.stopPropagation()}
                style={{ animation: 'scale-in 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}
            >
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white z-10 p-2 rounded-full bg-gray-900/50 hover:bg-gray-700/70 transition-colors">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <img src={meme.imageUrl} alt="Enlarged Meme" className="w-full h-auto max-h-[80vh] object-contain" />
                
                <div className="p-4 bg-gray-800 border-t border-gray-700 space-y-3">
                    
                    {/* YENİ: İndirme Butonu */}
                    <button
                        onClick={handleDownload}
                        className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
                    >
                        Download Meme
                    </button>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        {/* Creator Name & Time */}
                        <div>
                            <p className="text-gray-300 font-medium">Creator Name</p>
                            <p className="text-indigo-400 font-bold">{meme.creatorName}</p>
                            <p className="text-gray-300 mt-2">Creation Time</p>
                            <p className="text-gray-400">{formatTimestamp(meme.createdAt)}</p>
                        </div>
                        
                        {/* Fee & Signed By */}
                        <div>
                            <p className="text-gray-300 font-medium">Transaction Fee</p>
                            <p className="text-green-400 font-bold">{meme.feeAmount} SOL</p>

                            <p className="text-gray-300 mt-2">Signed by (TX)</p>
                            <a
                                href={`${SOLSCAN_URL}${meme.txSignature}${SOLSCAN_PARAMS}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 font-mono text-xs md:text-sm break-all flex items-center gap-2 transition-colors"
                                title="View Transaction on Solscan"
                            >
                                {meme.txSignature.slice(0, 8)}...{meme.txSignature.slice(-8)}
                                <ExternalLinkIcon className="w-4 h-4 shrink-0" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes scale-in {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scale-in {
                    animation: scale-in 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};