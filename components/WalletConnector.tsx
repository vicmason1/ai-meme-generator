import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletModalButton } from '@solana/wallet-adapter-react-ui'; 
import { CloseIcon } from './icons';

interface WalletConnectorProps {
    walletAddress: string | null;
    onConnect: () => void;
    onDisconnect: () => void;
}

export const WalletConnector: React.FC<WalletConnectorProps> = ({ walletAddress, onConnect, onDisconnect }) => {
    // Tüm cüzdan durumunu useWallet hook'undan çekiyoruz
    const { publicKey, connected, disconnect, connecting } = useWallet();
    const isConnected = connected;
    const currentAddress = publicKey ? publicKey.toBase58() : null;

    if (isConnected && currentAddress) {
        return (
            <div className="flex items-center space-x-3 bg-gray-700 p-2 rounded-full pr-1 shadow-md border border-indigo-500">
                <span className="text-sm font-mono text-indigo-300 hidden sm:block">
                    {currentAddress.slice(0, 4)}...{currentAddress.slice(-4)}
                </span>
                <span className="text-sm font-mono text-indigo-300 block sm:hidden">
                    {currentAddress.slice(0, 4)}...
                </span>
                <button
                    onClick={onDisconnect} // App.tsx'teki disconnect'i çağırır
                    className="p-1 bg-red-600 rounded-full text-white hover:bg-red-500 transition-colors"
                    title="Disconnect Wallet"
                    disabled={connecting}
                >
                    <CloseIcon className="w-4 h-4" />
                </button>
            </div>
        );
    }
    
    // WalletModalButton, onConnect prop'unu yoksayar ve modalı kendisi açar
    return (
        <WalletModalButton 
            className="!bg-green-600 hover:!bg-green-500 transition-colors py-2 px-4 text-sm font-medium rounded-lg"
            onClick={onConnect} // Sadece clearError için çağrılır
        >
            Connect Wallet
        </WalletModalButton>
    );
};