import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Cloudflare Tunnel Bağlantı Ayarları
  server: {
    host: '0.0.0.0', 
    port: 5173,      
    // ------------------------------------------------------------------
    // YENİ EKLEME: Tüm harici host'lardan gelen bağlantılara izin verir
    allowedHosts: true, 
    // ------------------------------------------------------------------
  },
  
  resolve: {
    alias: {
      'buffer': 'buffer',
      'stream': 'stream-browserify',
      'assert': 'assert',
      'util': 'util',
    },
  },
  define: {
    'process.env': {},
    'global': 'globalThis',
    'process.env.NODE_DEBUG': 'false', 
  },
  optimizeDeps: {
    include: [
        '@solana/web3.js', 
        '@solana/wallet-adapter-react', 
        '@solana/wallet-adapter-react-ui',
        '@solana/wallet-adapter-base',
        'bn.js',
        'buffer',
        'assert',
        'util',
        'stream-browserify',
    ],
  },
});
