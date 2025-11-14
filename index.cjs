const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// --- KONFİGÜRASYON ---
const PORT = 3000;
const HOST = '0.0.0.0';

const DIST_PATH = path.join(__dirname, 'dist'); 
const STORAGE_DIR = path.join(__dirname, 'storage');
const IMAGES_DIR = path.join(STORAGE_DIR, 'images'); // <<< YENİ: Resimlerin yolu
const DATA_FILE = path.join(STORAGE_DIR, 'data.json');
const PUBLIC_IP = 'YOUR_SERVER_PUBLIC_IP'; 

const app = express();

// --- ARA KATMAN YAZILIMLARI (MIDDLEWARE) ---
app.use(cors());
// Resim verisi (Base64) için limiti artırıyoruz.
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true }));

// <<< YENİ EKLEME: Resimlerin URL üzerinden erişilebilir olması
app.use('/images', express.static(IMAGES_DIR));

// --- VERİ İŞLEME YARDIMCI FONKSİYONLARI ---

/**
 * Depolama klasörünü, resim klasörünü ve veri dosyasını kontrol eder ve yoksa oluşturur.
 */
function ensureStorageExists() {
    try {
        if (!fs.existsSync(STORAGE_DIR)) {
            fs.mkdirSync(STORAGE_DIR, { recursive: true });
        }
        // <<< DÜZELTME: images klasörünü oluşturuyoruz
        if (!fs.existsSync(IMAGES_DIR)) {
            fs.mkdirSync(IMAGES_DIR, { recursive: true });
            console.log("storage/images klasörü oluşturuldu.");
        }
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, JSON.stringify([])); 
            console.log("storage/data.json dosyası oluşturuldu.");
        }
    } catch (error) {
        console.error("Depolama alanı oluşturulurken hata oluştu:", error);
    }
}

/**
 * Mevcut veriyi dosyadan okur.
 * @returns {Array} Meme verisi.
 */
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const parsedData = JSON.parse(data);
        return Array.isArray(parsedData) ? parsedData : []; 
    } catch (error) {
        console.error("Hata! data.json okunamadı veya doğru formatta değil:", error.message);
        return [];
    }
}

/**
 * Veriyi dosyaya yazar.
 * @param {Array} data - Yazılacak meme verisi.
 */
function writeData(data) {
    try {
        // Veriyi yazarken, potansiyel olarak iç IP içeren URL'leri Public IP ile düzeltme
        const updatedData = data.map(meme => {
            if (meme.imageUrl && meme.imageUrl.includes('YOUR_IP') && !meme.imageUrl.startsWith('data:')) {
                return { ...meme, imageUrl: meme.imageUrl.replace('YOUR_IP', PUBLIC_IP) };
            }
            return meme;
        });
        fs.writeFileSync(DATA_FILE, JSON.stringify(updatedData, null, 2), 'utf8');
    } catch (error) {
        console.error("Hata! data.json yazılamadı:", error.message);
    }
}


// Başlangıçta depolama alanını oluşturduğumuzdan emin olalım
ensureStorageExists();
console.log(`JSON Veri Yolu: ${DATA_FILE}`);
console.log(`Statik Resim Yolu: /images -> ${IMAGES_DIR}`);


// --- API YOLLARI ---

// 1. Meme listesini getir
app.get('/api/memes', (req, res) => {
    const memes = readData();
    // Frontende göndermeden önce Base64 verisi içermediğinden emin olun (kayıt başarılı ise URL olmalı)
    res.json(memes);
});

// 2. Yeni meme oluştur/kaydet (Base64'ü dosyaya kaydetme işlemini yapar)
app.post('/api/upload', (req, res) => {
    const newMeme = req.body;
    
    if (!newMeme || !newMeme.walletAddress || !newMeme.imageUrl) {
        return res.status(400).json({ success: false, message: "Geçersiz meme verisi veya resim eksik." });
    }

    const memes = readData();
    const id = newMeme.id || Date.now().toString(); 
    const fileExtension = 'jpeg'; // Frontend kodunuza göre varsayılan olarak jpeg kabul ediliyor
    const fileName = `${id}.${fileExtension}`;
    const filePath = path.join(IMAGES_DIR, fileName);

    // --- BASE64 İŞLEME VE DOSYAYA KAYDETME ---
    try {
        // Base64 verisinin başındaki "data:image/jpeg;base64," kısmını kaldırıyoruz
        const base64Data = newMeme.imageUrl.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Resmi dosyaya kaydediyoruz
        fs.writeFileSync(filePath, imageBuffer);
        
        // Frontend'in erişeceği, kalıcı URL'yi oluşturuyoruz
        const finalImageUrl = `http://${PUBLIC_IP}:${PORT}/images/${fileName}`;

        // Veritabanına (data.json) kaydedilecek meme nesnesini oluşturuyoruz (URL ile)
        const memeToSave = { 
            id, 
            imageUrl: finalImageUrl, // <<< KALICI URL
            walletAddress: newMeme.walletAddress,
            txSignature: newMeme.txSignature,
            creatorName: newMeme.creatorName,
            createdAt: newMeme.createdAt,
            feeAmount: newMeme.feeAmount
        };

        memes.push(memeToSave);
        writeData(memes);
        
        // Frontend'e başarılı kaydı ve yeni URL'yi geri döndürüyoruz
        res.status(201).json({ 
            success: true, 
            message: "Meme başarıyla kaydedildi ve dosyalandı.", 
            imageUrl: finalImageUrl // FRONTEND BU URL'Yİ KULLANACAK
        });

    } catch (error) {
        console.error("Resim kaydetme veya veri işleme hatası:", error);
        res.status(500).json({ success: false, message: "Resim sunucuya kaydedilemedi." });
    }
});

// 3. Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'meme-backend', version: '1.0.1' });
});


// --- STATİK VE FALLBACK YÖNLENDİRME (FRONTEND SUNUMU) ---

// Frontend build dosyalarını sun
app.use(express.static(DIST_PATH));

// SPA (Single Page Application) Fallback Yönlendirmesi
app.use((req, res, next) => {
    // Sadece GET isteklerini ele alıyoruz
    if (req.method !== 'GET') {
        return res.status(404).json({ success: false, message: "Yol bulunamadı." });
    }

    // İstek yolu /api ile başlıyorsa ve yukarıdaki API rotalarıyla eşleşmediyse 404 döndür.
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, message: "API rotası bulunamadı." });
    }
    
    // Geriye kalan tüm GET istekleri için index.html'i gönder (SPA fallback)
    res.sendFile(path.join(DIST_PATH, 'index.html'));
});


// --- SUNUCU BAŞLANGICI ---
app.listen(PORT, HOST, () => {
    console.log(`Backend API sunucusu ${HOST}:${PORT} adresinde çalışıyor.`);
    console.log(`Erişim adresi: http://${PUBLIC_IP}:${PORT}/`);
});
