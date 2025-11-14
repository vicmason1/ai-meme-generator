import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

// Düzeltme: Backpack'i Standard Wallet olarak bırakıyoruz, sadece Phantom'u manuel ekleyelim.
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'; 
// import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack'; // Bu uyarı verdiği için kaldırıldı.

import { clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

// Cüzdan modal stilleri
import '@solana/wallet-adapter-react-ui/styles.css'; 

// Solana Ağı Ayarları
const network = WalletAdapterNetwork.Devnet; 
const RPC_URL = 'https://rpc.testnet.carv.io/rpc';

const Root = () => {
  // Kullanılacak cüzdanları useMemo içinde initialize ediyoruz.
  // Backpack'i kaldırıyoruz, Standard Wallet olarak otomatik algılanacaktır.
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
  ], [network]);

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect={true}> 
        <WalletModalProvider>
          <React.StrictMode>
            <App />
          </React.StrictMode>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(<Root />);
