import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

import { Header } from './components/Header';
import { ImageSelector } from './components/ImageSelector';
import { MemeEditor } from './components/MemeEditor';
import { RecentCreations } from './components/RecentCreations';
import { ImageModal } from './components/ImageModal';
import { WalletConnector } from './components/WalletConnector';
import { WelcomeModal } from './components/WelcomeModal'; 
import type { Meme, Language } from './types';
import { generateCaptions, translateCaptions, editImageWithText } from './services/geminiService';

// VVV YENİ SABİT: Popup'ın bir daha gösterilmemesi için kullanılan localStorage anahtarı
const HAS_SEEN_MODAL_KEY = 'carv_meme_modal_seen';
// ^^^ YENİ SABİT ^^^

// =========================================================
// YENİ SABİTLER: Yükleme Dayanıklılığı İçin Eklendi
// =========================================================
const MAX_UPLOAD_RETRIES = 5;
const RETRY_DELAY_MS = 1500; // 1.5 saniye bekleme
// =========================================================

// =========================================================
// ORACLE VM BACKEND AYARLARI
// =========================================================
// *** DÜZELTME: Backend'e Public IP üzerinden ulaşmak için ayarlandı ***
const ORACLE_IP = 'YOUR_SERVER_PUBLIC_IP'; // <<< MUST BE SET BY USER
const YOUR_BACKEND_API_URL = `http://${ORACLE_IP}:3000`;
const MEME_LIST_ENDPOINT = `${YOUR_BACKEND_API_URL}/api/memes`;
const MEME_UPLOAD_ENDPOINT = `${YOUR_BACKEND_API_URL}/api/upload`;
// =========================================================

// =========================================================
// GERÇEK SOLANA AYARLARI 
// =========================================================
const MEME_FEE_RECEIVER = 'YOUR_FEE_RECEIVER_ADDRESS'; // <<< MUST BE SET BY USER
const TRANSFER_AMOUNT_SOL = 0.0001;
const RPC_URL = 'https://rpc.testnet.carv.io/rpc';
const connection = new Connection(RPC_URL, 'confirmed');
// =========================================================

const App: React.FC = () => {
    const { publicKey, connected, sendTransaction, disconnect } = useWallet();
    const walletAddress = publicKey ? publicKey.toBase58() : null;
    const isConnected = connected;

    const [creatorName, setCreatorName] = useState<string>('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [originalCaptions, setOriginalCaptions] = useState<string[]>([]);
    const [displayCaptions, setDisplayCaptions] = useState<string[]>([]);
    const [selectedCaption, setSelectedCaption] = useState<string>('');
    const [recentMemes, setRecentMemes] = useState<Meme[]>([]);
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [viewingMeme, setViewingMeme] = useState<Meme | null>(null);

    const [textColor, setTextColor] = useState<string>('#FFFFFF');

    // VVV YENİ STATE: WelcomeModal'ı kontrol eder
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    // ^^^ YENİ STATE ^^^

    const clearError = () => setError(null);

    const handleConnect = useCallback(() => { clearError(); }, []);
    const handleDisconnect = useCallback(() => { disconnect(); }, [disconnect]);

    // VVV YENİ HOOK: Popup'ın ilk girişte gösterilip gösterilmediğini kontrol etme
    useEffect(() => {
        // Kullanıcı daha önce popup'ı görmediyse göster
        if (!localStorage.getItem(HAS_SEEN_MODAL_KEY)) {
            setShowWelcomeModal(true);
        }
    }, []);
    
    // VVV YENİ HANDLER: Popup'ı kapatma ve bir daha göstermemek için kaydetme
    const handleCloseWelcomeModal = useCallback(() => {
        localStorage.setItem(HAS_SEEN_MODAL_KEY, 'true');
        setShowWelcomeModal(false);
    }, []);
    // ^^^ YENİ HOOK ve HANDLER ^^^

    // YENİ: Component ilk yüklendiğinde API'den meme listesini çekme (Mevcut kodunuzdan alındı)
    useEffect(() => {
        const loadRecentMemes = async () => {
            setIsLoading('Loading latest creations from server...');
            try {
                // Backend API'nizden listeyi çekin
                const response = await fetch(MEME_LIST_ENDPOINT);
                if (!response.ok) throw new Error("Failed to fetch meme list from server.");

                const serverMemes: Meme[] = await response.json();

                // *** DÜZELTME: Backend'den gelen verinin bir dizi olduğundan emin olun ***
                if (!Array.isArray(serverMemes)) {
                    throw new Error("Server returned invalid data format for meme list.");
                }
                // **********************************************************************

                // En yeni 5 taneyi gösterelim
                setRecentMemes(serverMemes.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5));
            } catch (e: any) {
                console.error("Could not load recent memes from API", e);
                // Eğer hata mesajı `ee.sort is not a function` ise, bu, backend'in hata döndürdüğü anlamına gelir.
                // Bu durumda `setRecentMemes` çağrılmayacağı için yerel durumunuz temiz kalır.
                // setError(`Could not load gallery: ${e.message}. Is the Oracle server running?`);
            } finally {
                setIsLoading(null);
            }
        };
        loadRecentMemes();
    }, []);

    const handleImageSelect = (imageBase64: string) => {
        setSelectedImage(imageBase64);
        setEditedImage(null);
        setOriginalCaptions([]);
        setDisplayCaptions([]);
        setSelectedCaption('');
        setTextColor('#FFFFFF');
        setCreatorName('');
        clearError();
    };

    const handleReset = () => {
        setSelectedImage(null);
        setEditedImage(null);
        setOriginalCaptions([]);
        setDisplayCaptions([]);
        setSelectedCaption('');
        setTextColor('#FFFFFF');
        setCreatorName('');
        clearError();
        setIsLoading(null);
    };

    // *** DÜZELTME: Bu fonksiyonun async olduğundan ve await kullandığından emin olun ***
    const handleMagicCaption = useCallback(async () => { // <-- async yapıldı
        const imageToProcess = editedImage || selectedImage;
        if (!imageToProcess) {
            setError('Please select an image first.');
            return;
        }
        setIsLoading('Generating captions...');
        clearError();
        try {
            const captions = await generateCaptions(imageToProcess); // <-- await eklendi
            setOriginalCaptions(captions);
            setDisplayCaptions(captions);
            setSelectedCaption(captions[0] || '');
        } catch (e) {
            console.error(e);
            setError('Failed to generate captions. Please try again.');
        } finally {
            setIsLoading(null);
        }
    }, [selectedImage, editedImage]);
    // ******************************************************************************

    const handleLanguageChange = useCallback(async (language: Language) => {
        if (!originalCaptions.length) {
            return;
        }
        if (language.code === 'en') {
            setDisplayCaptions(originalCaptions);
            setSelectedCaption(originalCaptions[0] || '');
            return;
        }
        setIsLoading(`Translating to ${language.name}...`);
        clearError();
        try {
            const translated = await translateCaptions(originalCaptions, language.name);
            setDisplayCaptions(translated);
            setSelectedCaption(translated[0] || '');
        } catch (e) {
            console.error(e);
            setError('Failed to translate captions.');
        } finally {
            setIsLoading(null);
        }
    }, [originalCaptions]);

    const handleImageEdit = useCallback(async (prompt: string) => {
        const imageToEdit = editedImage || selectedImage;
        if (!imageToEdit) {
            setError('Please select an image to edit.');
            return;
        }
        if (!prompt.trim()) {
            setError('Please enter an edit instruction.');
            return;
        }

        setIsLoading('Applying AI edit...');
        clearError();

        try {
            const newImage = await editImageWithText(imageToEdit, prompt);
            setEditedImage(newImage);
        } catch (e) {
            console.error(e);
            setError('Failed to edit image. The model may have content safety restrictions.');
        } finally {
            setIsLoading(null);
        }
    }, [selectedImage, editedImage]);

    // GERÇEK SOLANA TX FONKSİYONU VE API KAYIT İŞLEMİ
    const handleFinalize = async (finalImage: string) => {
        if (!publicKey || !sendTransaction) {
            setError('Wallet not fully connected. Please connect your wallet.');
            return;
        }
        if (!creatorName.trim()) {
            setError('Please enter your name to finalize your creation.');
            return;
        }

        clearError();
        setIsLoading(`Awaiting signature to send ${TRANSFER_AMOUNT_SOL} SOL fee...`);

        try {
            const fromPubkey = publicKey;
            const toPubkey = new PublicKey(MEME_FEE_RECEIVER);
            const lamports = Math.round(TRANSFER_AMOUNT_SOL * LAMPORTS_PER_SOL);

            let transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: fromPubkey,
                    toPubkey: toPubkey,
                    lamports: lamports,
                })
            );

            const { blockhash } = await connection.getLatestBlockhash('finalized');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = fromPubkey;

            setIsLoading('Awaiting wallet signature...');
            const txSignature = await sendTransaction(transaction, connection);

            console.log(`[SOLANA TX SUCCESS] Signature: ${txSignature}`);

            // YENİ MEME OBJESİNİ OLUŞTURMA (imageUrl Base64 verisidir)
            const newMeme: Meme = {
                id: Date.now().toString(),
                imageUrl: finalImage, // Base64 veri
                walletAddress: walletAddress!,
                txSignature: txSignature,
                creatorName: creatorName.trim(),
                createdAt: Date.now(),
                feeAmount: TRANSFER_AMOUNT_SOL
            };

            let uploadSuccessful = false;

            // --- YENİ: Yükleme için yeniden deneme mekanizması ---
            for (let attempt = 1; attempt <= MAX_UPLOAD_RETRIES; attempt++) {
                try {
                    setIsLoading(`Transaction confirmed, uploading meme data... (Attempt ${attempt}/${MAX_UPLOAD_RETRIES})`);
                    
                    // Veriyi Oracle Backend API'ye gönder
                    const uploadResponse = await fetch(MEME_UPLOAD_ENDPOINT, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(newMeme),
                    });

                    const result = await uploadResponse.json();
                    if (!uploadResponse.ok) {
                        throw new Error(result.message || `Backend upload failed (Status: ${uploadResponse.status})`);
                    }

                    // Başarılı oldu: Listeyi güncelleyin (Backend'den gelen finalImageUrl ile)
                    const finalMemeWithUrl = { ...newMeme, imageUrl: result.imageUrl };
                    setRecentMemes(prev => [finalMemeWithUrl, ...prev.slice(0, 4)]);
                    uploadSuccessful = true;
                    break; // Exit retry loop on success
                } catch (e: any) {
                    console.error(`Upload attempt ${attempt} failed:`, e);
                    if (attempt < MAX_UPLOAD_RETRIES) {
                        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                    } else {
                        // If all retries fail, propagate the error to be caught below
                        throw e;
                    }
                }
            }

            if (uploadSuccessful) {
                handleReset();
            }


        } catch (e: any) {
            console.error('Transaction or Upload failed:', e);
            if (e.name === 'WalletAdapterAbort') {
                setError('Transaction cancelled by user.');
            } else {
                // Error message now includes details from failed upload attempts if retries were exhausted
                setError(`Transaction/Upload failed: ${e.message || 'Unknown error'}. Please check Oracle firewall rules.`);
            }
        } finally {
            setIsLoading(null);
        }
    };


    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
            <Header
                walletAddress={walletAddress}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
            />
            <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center">
                {error && (
                    <div className="w-full max-w-5xl bg-red-800 border border-red-600 text-white px-4 py-3 rounded-lg relative mb-4">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                        <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={clearError}>
                            <svg className="fill-current h-6 w-6 text-red-400" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1 1 0 0 1-1.414 0L10 11.414l-2.934 2.935a1 1 0 1 1-1.414-1.414l2.934-2.935-2.934-2.935a1 1 0 1 1 1.414-1.414L10 8.586l2.934-2.935a1 1 0 0 1 1.414 1.414L11.414 10l2.934 2.935a1 1 0 0 1 0 1.414z"/></svg>
                        </span>
                    </div>
                )}
                {!selectedImage ? (
                    <ImageSelector onImageSelect={handleImageSelect} />
                ) : (
                    <MemeEditor
                        image={editedImage || selectedImage}
                        captions={displayCaptions}
                        selectedCaption={selectedCaption}
                        onSelectedCaptionChange={setSelectedCaption}
                        onMagicCaption={handleMagicCaption}
                        onLanguageChange={handleLanguageChange}
                        onImageEdit={handleImageEdit}
                        onFinalize={handleFinalize}
                        onReset={handleReset}
                        isLoading={isLoading}
                        isConnected={isConnected}
                        textColor={textColor}
                        onTextColorChange={setTextColor}
                        creatorName={creatorName} 
                        onCreatorNameChange={setCreatorName} 
                        walletAddress={walletAddress}
                    />
                )}
                <RecentCreations memes={recentMemes} onMemeClick={setViewingMeme} />
            </main>
            {viewingMeme && (
                <ImageModal meme={viewingMeme} onClose={() => setViewingMeme(null)} />
            )}
            
            {/* VVV YENİ MODAL RENDER VVV */}
            {showWelcomeModal && (
                <WelcomeModal onClose={handleCloseWelcomeModal} />
            )}
            {/* ^^^ YENİ MODAL RENDER ^^^ */}
        </div>
    );
};

export default App;
