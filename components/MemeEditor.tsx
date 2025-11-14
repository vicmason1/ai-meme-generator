import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Language } from '../types';
import { LANGUAGES } from '../constants';
import { Loader } from './Loader';
import { MagicWandIcon, ResetIcon, EditIcon, CheckIcon, PlusIcon, MinusIcon } from './icons';

// ====================================================================
// TİP TANIMI: Her metin katmanı için ayrı durum
// ====================================================================
interface TextLayer {
    id: string; 
    text: string;
    x: number;
    y: number;
    fontSizeMultiplier: number;
    textColor: string;
}
// ====================================================================

interface MemeEditorProps {
    image: string;
    captions: string[]; // Sadece seçim listesi için
    onMagicCaption: () => void;
    onLanguageChange: (language: Language) => void;
    onImageEdit: (prompt: string) => void;
    onFinalize: (finalImage: string) => void;
    onReset: () => void;
    isLoading: string | null;
    isConnected: boolean;

    // PROP'LAR
    walletAddress: string | null;
    creatorName: string; // BU ALAN ARTIK MEME BAŞLIĞI/OLUŞTURUCU ADI OLACAK
    onCreatorNameChange: (name: string) => void;
}

export const MemeEditor: React.FC<MemeEditorProps> = ({
    image,
    captions,
    onMagicCaption,
    onLanguageChange,
    onImageEdit,
    onFinalize,
    onReset,
    isLoading,
    isConnected,
    walletAddress,
    creatorName, 
    onCreatorNameChange
}) => {
    const [customText, setCustomText] = useState(''); // Elle girilen metin
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
    
    const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
    const [isDraggingText, setIsDraggingText] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isHoveringText, setIsHoveringText] = useState(false);
    
    const activeLayer = textLayers.find(l => l.id === activeLayerId) || null;
    
    const [imageScale, setImageScale] = useState(1);
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
    const [isPanningImage, setIsPanningImage] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    const getCanvasMousePos = (canvas: HTMLCanvasElement, event: MouseEvent | React.MouseEvent<HTMLCanvasElement> | WheelEvent) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    };

    const getTextBoundingBox = (ctx: CanvasRenderingContext2D, layer: TextLayer) => {
        const baseFontSize = ctx.canvas.width / 15;
        ctx.font = `bold ${baseFontSize * layer.fontSizeMultiplier}px 'Inter', sans-serif`;
        
        const uppercaseText = layer.text.toUpperCase();
        
        const metrics = ctx.measureText(uppercaseText);
        const fontHeight = baseFontSize * layer.fontSizeMultiplier;
        const width = metrics.width;
        const height = fontHeight; 

        return {
            x: layer.x - width / 2,
            y: layer.y - fontHeight,
            width: width,
            height: height * 1.5 
        };
    };

    const initializeCanvasLayout = useCallback(() => {
        const canvas = canvasRef.current;
        const img = imageRef.current;
        if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;
        
        const parent = canvas.parentElement;
        if (!parent) return;

        const containerWidth = parent.clientWidth;
        const containerHeight = parent.clientHeight;
        canvas.width = containerWidth;
        canvas.height = containerHeight;
        
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const containerRatio = canvas.width / canvas.height;
        
        let scale;
        
        if (imgRatio > containerRatio) {
            scale = canvas.width / img.naturalWidth;
        } else {
            scale = canvas.height / img.naturalHeight;
        }
        
        setImageScale(scale);
        
        const scaledImgWidth = img.naturalWidth * scale;
        const scaledImgHeight = img.naturalHeight * scale;
        
        const initialX = (canvas.width - scaledImgWidth) / 2;
        const initialY = (canvas.height - scaledImgHeight) / 2;
        setImagePosition({ x: initialX, y: initialY });
        
    }, []); 

    const handleAddCaptionAsLayer = useCallback((caption: string) => {
        if (!caption.trim()) return; 

        const canvas = canvasRef.current;
        if (!canvas) return;

        const existingCount = textLayers.length;
        const defaultY = canvas.height - (canvas.height / 10) - (existingCount * 40);
        const { x, y } = { x: canvas.width / 2, y: defaultY };

        const newLayer: TextLayer = {
            id: Date.now().toString(), 
            text: caption,
            x,
            y,
            fontSizeMultiplier: 1,
            textColor: '#FFFFFF', 
        };

        setTextLayers(prev => [...prev.map(l => ({...l})), newLayer]);
        setActiveLayerId(newLayer.id);
        setCustomText(''); 

    }, [textLayers]);


    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const img = imageRef.current;
        if (!canvas || !img) return; 

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (img.complete && img.naturalWidth > 0) {
            ctx.drawImage(
                img,
                imagePosition.x,
                imagePosition.y,
                img.naturalWidth * imageScale,
                img.naturalHeight * imageScale
            );
        }

        textLayers.forEach(layer => {
            const baseFontSize = canvas.width / 15;
            ctx.font = `bold ${baseFontSize * layer.fontSizeMultiplier}px 'Inter', sans-serif`;
            ctx.fillStyle = layer.textColor; 
            ctx.strokeStyle = 'black';
            ctx.lineWidth = baseFontSize * layer.fontSizeMultiplier / 15;
            ctx.textAlign = 'center';
            
            const text = layer.text.toUpperCase();
            
            ctx.strokeText(text, layer.x, layer.y);
            ctx.fillText(text, layer.x, layer.y);

            if (layer.id === activeLayerId) {
                const bbox = getTextBoundingBox(ctx, layer);
                if (bbox) {
                    ctx.strokeStyle = '#6366f1'; 
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
                    ctx.setLineDash([]); 
                    ctx.strokeStyle = 'black';
                }
            }
        });

    }, [textLayers, activeLayerId, imageScale, imagePosition]); 

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const pos = getCanvasMousePos(canvas, e);
        
        let draggedLayer: TextLayer | null = null;

        for(let i = textLayers.length - 1; i >= 0; i--) {
            const layer = textLayers[i];
            const ctx = canvas.getContext('2d')!;
            const bbox = getTextBoundingBox(ctx, layer);
            
            if (bbox && pos.x > bbox.x && pos.x < bbox.x + bbox.width && pos.y > bbox.y && pos.y < bbox.y + bbox.height) {
                draggedLayer = layer;
                setActiveLayerId(layer.id); 
                break;
            }
        }
        
        if (draggedLayer) {
            setIsDraggingText(true);
            setDragOffset({
                x: pos.x - draggedLayer.x,
                y: pos.y - draggedLayer.y
            });
            return;
        }

        setActiveLayerId(null); 
        setIsPanningImage(true);
        setPanStart({
            x: pos.x - imagePosition.x,
            y: pos.y - imagePosition.y
        });
    };
    
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const pos = getCanvasMousePos(canvas, e);

        if (isDraggingText && activeLayerId) {
            setTextLayers(prev => 
                prev.map(l => l.id === activeLayerId ? 
                    { ...l, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y } : l
                )
            );
        } else if (isPanningImage) {
            setImagePosition({
                x: pos.x - panStart.x,
                y: pos.y - panStart.y
            });
        } else {
            let isHovering = false;
            for(let i = textLayers.length - 1; i >= 0; i--) {
                const layer = textLayers[i];
                const ctx = canvas.getContext('2d')!;
                const bbox = getTextBoundingBox(ctx, layer);
                if (bbox && pos.x > bbox.x && pos.x < bbox.x + bbox.width && pos.y > bbox.y && pos.y < bbox.y + bbox.height) {
                    isHovering = true;
                    break;
                }
            }
            setIsHoveringText(isHovering);
        }
    };
    
    const handleMouseUp = () => {
        setIsDraggingText(false);
        setIsPanningImage(false);
    };

    const handleMouseLeave = () => {
        setIsDraggingText(false);
        setIsPanningImage(false);
        setIsHoveringText(false);
    };
    
    const handleWheelLogic = useCallback((e: WheelEvent) => {
        const canvas = canvasRef.current;
        const img = imageRef.current;

        if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;

        const pos = getCanvasMousePos(canvas, e);
        const scaledImgWidth = img.naturalWidth * imageScale;
        const scaledImgHeight = img.naturalHeight * imageScale;
        
        const imageBounds = {
            left: imagePosition.x,
            top: imagePosition.y,
            right: imagePosition.x + scaledImgWidth,
            bottom: imagePosition.y + scaledImgHeight
        };

        const isMouseOverImage = (
            pos.x >= imageBounds.left &&
            pos.x <= imageBounds.right &&
            pos.y >= imageBounds.top &&
            pos.y <= imageBounds.bottom
        );

        if (!isMouseOverImage || isDraggingText || isPanningImage) {
            return; 
        }
        
        const scaleAmount = -e.deltaY * 0.001;
        const newScale = Math.max(0.1, Math.min(imageScale + scaleAmount, 5));
        
        const worldX = (pos.x - imagePosition.x) / imageScale;
        const worldY = (pos.y - imagePosition.y) / imageScale;
        
        const newImageX = pos.x - worldX * newScale;
        const newImageY = pos.y - worldY * newScale;

        setImageScale(newScale);
        setImagePosition({ x: newImageX, y: newImageY });
    }, [imageScale, imagePosition, isDraggingText, isPanningImage]);

    useEffect(() => { drawCanvas(); }, [drawCanvas]); 

    useEffect(() => {
        const img = imageRef.current;
        
        const handleLoad = () => { initializeCanvasLayout(); };
        
        if (img) {
            img.addEventListener('load', handleLoad);
            if (img.complete && img.naturalWidth > 0) { handleLoad(); }
        }
       
        window.addEventListener('resize', initializeCanvasLayout);

        return () => {
            if (img) img.removeEventListener('load', handleLoad);
            window.removeEventListener('resize', initializeCanvasLayout);
        };
    }, [image, initializeCanvasLayout]); 

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const nativeWheelHandler = (e: WheelEvent) => {
            e.preventDefault(); 
            handleWheelLogic(e);
        };
        canvas.addEventListener('wheel', nativeWheelHandler, { passive: false });
        return () => { canvas.removeEventListener('wheel', nativeWheelHandler); };
    }, [handleWheelLogic]); 

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.style.cursor = isHoveringText ? 'move' : isPanningImage ? 'grabbing' : 'grab';
        }
    }, [isHoveringText, isPanningImage]);

    const handleFinalizeClick = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            onFinalize(canvas.toDataURL('image/jpeg', 0.9)); 
        }
    };
    
    const handleFontSizeChange = (delta: number) => {
        if (!activeLayerId) return;
        setTextLayers(prev => 
            prev.map(l => l.id === activeLayerId ? 
                { ...l, fontSizeMultiplier: Math.max(0.2, Math.min(3, l.fontSizeMultiplier + delta)) } : l
            )
        );
    }
    
    const handleTextColorChange = (color: string) => {
        if (!activeLayerId) return;
        setTextLayers(prev => 
            prev.map(l => l.id === activeLayerId ? { ...l, textColor: color } : l)
        );
    }
    
    const isFinalizeDisabled = !!isLoading || !isConnected || !creatorName.trim() || textLayers.length === 0;

    return (
        <div className="w-full max-w-6xl">
            <div className="flex justify-end mb-4">
                <button
                    onClick={onReset}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600"
                >
                    <ResetIcon className="w-4 h-4 mr-2" />
                    Start Over
                </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-gray-900 rounded-2xl p-4 border border-gray-700 flex items-center justify-center relative min-h-[300px] md:min-h-[500px] overflow-hidden">
                    {isLoading && <Loader message={isLoading} />}
                    <div className="w-full h-full flex items-center justify-center">
                        <canvas 
                            ref={canvasRef} 
                            className="max-w-full max-h-full"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseLeave}
                        />
                        <img ref={imageRef} src={image} className="hidden" alt="Meme preview" crossOrigin="anonymous" />
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    {/* 1. Generate Captions */}
                    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                        <h3 className="text-xl font-bold mb-4 text-indigo-300">1. Generate Captions</h3>
                        <button
                            onClick={onMagicCaption}
                            disabled={!!isLoading}
                            className="w-full flex items-center justify-center px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors"
                        >
                            <MagicWandIcon className="w-5 h-5 mr-2" />
                            Magic Caption
                        </button>
                    </div>

                    {captions.length > 0 && (
                        <>
                            {/* 2. Select & Add Layer */}
                            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                                <h3 className="text-xl font-bold mb-4 text-indigo-300">2. AI Captions & Translate</h3>
                                <select 
                                    onChange={(e) => onLanguageChange(LANGUAGES.find(l => l.code === e.target.value)!)} 
                                    className="w-full p-2 mb-4 bg-gray-700 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    {LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                                </select>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                    {captions.map((caption, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleAddCaptionAsLayer(caption)} 
                                            className={`w-full text-left p-3 rounded-md transition-colors text-sm bg-gray-700 hover:bg-gray-600`}
                                        >
                                            <PlusIcon className="w-4 h-4 mr-2 inline-block"/> {caption}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* 3. Add Custom Text Layer */}
                            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                                <h3 className="text-xl font-bold mb-4 text-indigo-300">3. Add Custom Text</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={customText}
                                        onChange={(e) => setCustomText(e.target.value)}
                                        placeholder="Enter your own meme text here"
                                        className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <button
                                        onClick={() => handleAddCaptionAsLayer(customText)}
                                        disabled={!customText.trim()}
                                        className="p-3 bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:bg-indigo-800"
                                    >
                                        <PlusIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>

                            {/* 4. Adjust Style & Image */}
                            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                                <h3 className="text-xl font-bold mb-4 text-indigo-300">4. Finalize Details & Style</h3>
                                <div className="space-y-4">
                                    
                                    {/* MEME BAŞLIĞI / OLUŞTURUCU ADI INPUTU */}
                                    <div>
                                        <label htmlFor="creatorName" className="block text-sm font-medium text-gray-300 mb-1">Meme Title / Creator Name (Required)</label>
                                        <input
                                            type="text"
                                            id="creatorName"
                                            value={creatorName}
                                            onChange={(e) => onCreatorNameChange(e.target.value)}
                                            placeholder={isConnected ? `Meme by ${walletAddress?.slice(0, 4)}...` : "My Awesome Meme"}
                                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                            maxLength={30}
                                        />
                                    </div>
                                    
                                    {/* Active Layers List */}
                                    <div className="pt-2 border-t border-gray-700">
                                        <h4 className="text-sm font-medium text-gray-300 mb-2">Active Text Layers ({textLayers.length}) - Click to Select/Drag</h4>
                                        <div className="space-y-1 max-h-24 overflow-y-auto pr-2">
                                            {textLayers.map(layer => (
                                                <div
                                                    key={layer.id}
                                                    onClick={() => setActiveLayerId(layer.id)}
                                                    className={`w-full flex justify-between items-center p-2 rounded-md transition-colors text-xs cursor-pointer ${activeLayerId === layer.id ? 'bg-indigo-600 border border-indigo-500 font-bold' : 'bg-gray-700 hover:bg-gray-600'}`}
                                                >
                                                    <span className="truncate">{layer.text}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setTextLayers(prev => prev.filter(l => l.id !== layer.id));
                                                            if (activeLayerId === layer.id) setActiveLayerId(null);
                                                        }}
                                                        className="ml-2 p-1 text-red-400 hover:text-red-300 transition-colors"
                                                        title="Remove Layer"
                                                    >
                                                        <MinusIcon className="w-4 h-4"/>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Aktif Katman Ayarları */}
                                    {activeLayer ? (
                                        <>
                                            <h4 className="text-lg font-semibold text-gray-300 pt-2 border-t border-gray-700">Style for: "{activeLayer.text.slice(0, 10)}..."</h4>
                                            {/* Text Size */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">Text Size</label>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleFontSizeChange(-0.1)} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600"><MinusIcon className="w-5 h-5"/></button>
                                                    <span className="flex-grow text-center text-sm font-mono text-gray-400">{(activeLayer.fontSizeMultiplier * 100).toFixed(0)}%</span>
                                                    <button onClick={() => handleFontSizeChange(0.1)} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600"><PlusIcon className="w-5 h-5"/></button>
                                                </div>
                                            </div>
                                            {/* Text Color */}
                                            <div>
                                                <label htmlFor="textColorActive" className="block text-sm font-medium text-gray-300 mb-2">Text Color</label>
                                                <input
                                                    type="color"
                                                    id="textColorActive"
                                                    value={activeLayer.textColor}
                                                    onChange={(e) => handleTextColorChange(e.target.value)}
                                                    className="w-full h-10 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
                                                    title="Text Color"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-sm text-gray-500 pt-2 border-t border-gray-700">Select a layer to adjust its style (size, color, position).</p>
                                    )}
                                    
                                    <h4 className="text-lg font-semibold text-gray-300 pt-2 border-t border-gray-700">Image Settings</h4>
                                    {/* Image Zoom */}
                                    <div>
                                        <label htmlFor="zoom" className="block text-sm font-medium text-gray-300 mb-1">Image Zoom (Use mouse wheel over canvas)</label>
                                        <input 
                                            type="range"
                                            id="zoom"
                                            min={0.1} 
                                            max={3}
                                            step={0.01}
                                            value={imageScale}
                                            onChange={(e) => setImageScale(parseFloat(e.target.value))}
                                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* 5. Finalize */}
                            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                                <h3 className="text-xl font-bold mb-4 text-green-300">5. Finalize</h3>
                                {!isConnected && (
                                     <p className="text-sm text-red-400 mb-3">Connect your wallet to sign and finalize your meme.</p>
                                )}
                                {!creatorName.trim() && isConnected && (
                                     <p className="text-sm text-yellow-400 mb-3">Please set your Meme Title / Creator Name before finalizing.</p>
                                )}
                                {!textLayers.length && isConnected && (
                                     <p className="text-sm text-yellow-400 mb-3">Please add at least one text layer to the meme.</p>
                                )}
                                <button
                                    onClick={handleFinalizeClick}
                                    disabled={isFinalizeDisabled} 
                                    className="w-full flex items-center justify-center px-6 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-500 disabled:bg-green-800 disabled:cursor-not-allowed transition-colors"
                                >
                                    <CheckIcon className="w-5 h-5 mr-2" />
                                    Finalize & Sign Meme
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};