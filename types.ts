export interface Language {
    code: string;
    name: string;
}

// YENİ EKLEME
export interface TemplateMeme {
    name: string;
    url: string;
}

export interface Meme {
    id: string;
    imageUrl: string;
    walletAddress: string;
    txSignature: string;
    creatorName: string;
    createdAt: number; // Unix timestamp
    feeAmount: number; // SOL cinsinden ücret miktarı
}
