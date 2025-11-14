import React from 'react';
// Bu importların çalışması için components/icons.tsx dosyasının mevcut ve bu ikonları içermesi gerekir.
import { CloseIcon, ExternalLinkIcon, InformationCircleIcon } from './icons'; 

interface WelcomeModalProps {
    onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
    return (
        // Modal Arka Planı
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            {/* Modal İçerik Kutusu */}
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md animate-scale-in border border-indigo-600">
                <div className="flex justify-between items-start border-b border-gray-700 pb-3 mb-4">
                    <div className="flex items-center">
                        <InformationCircleIcon className="w-6 h-6 text-indigo-400 mr-2" />
                        <h2 className="text-xl font-bold text-white">Project Information</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Ana İçerik */}
                <p className="text-gray-300 mb-4">
                    This project was designed for the **Carv Hackathon competition**.
                </p>

                <h3 className="text-lg font-semibold text-white mb-2">Important Links:</h3>
                <ul className="space-y-2 mb-6">
                    <li>
                        <a href="https://discord.gg/KBVDcAMC" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center">
                            Discord Server <ExternalLinkIcon className="w-4 h-4 ml-2" />
                        </a>
                    </li>
                    <li>
                        <a href="https://carv.io/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center">
                            Carv Official Site <ExternalLinkIcon className="w-4 h-4 ml-2" />
                        </a>
                    </li>
                    <li>
                        <a href="https://play.carv.io/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center">
                            Carv Play Site <ExternalLinkIcon className="w-4 h-4 ml-2" />
                        </a>
                    </li>
                </ul>

                <div className="bg-yellow-900/50 p-3 rounded-lg border border-yellow-700">
                    <p className="text-sm font-medium text-yellow-300">
                        <strong className="text-white">API Usage Notice:</strong> This application uses free third-party APIs.
                    </p>
                    <p className="text-sm text-yellow-200 mt-1">
                        **In some cases, the service might be temporarily unavailable due to API traffic or rate limits. Please try again later.**
                    </p>
                </div>

                <div className="mt-6 text-center">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
                    >
                        Got it! Start Creating Memes
                    </button>
                </div>
            </div>
            {/* Tailwind CSS Animasyonu */}
            <style>{`
                @keyframes scale-in {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scale-in {
                    animation: scale-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
            `}</style>
        </div>
    );
};