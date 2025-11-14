// START OF FILE Header.tsx

import React from 'react';
import { SparklesIcon } from './icons';
import { WalletConnector } from './WalletConnector';

interface HeaderProps {
    walletAddress: string | null;
    onConnect: () => void;
    onDisconnect: () => void;
}

export const Header: React.FC<HeaderProps> = ({ walletAddress, onConnect, onDisconnect }) => {
    return (
        <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                    <SparklesIcon className="h-8 w-8 text-indigo-400 mr-3" />
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                        CARVUX <span className="text-indigo-400">MemeGen</span>
                    </h1>
                </div>
                <WalletConnector 
                    walletAddress={walletAddress} 
                    onConnect={onConnect} 
                    onDisconnect={onDisconnect} 
                />
            </div>
        </header>
    );
};