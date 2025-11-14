🤖 AI Meme Generator (Solana & Gemini Powered)
A Carv Community Hackathon Submission

This project is a feature-rich, decentralized application that allows users to generate, edit, and mint AI-powered memes, secured and authenticated via Solana wallet transactions. 
It combines cutting-edge Generative AI (Gemini) with Solana's on-chain verification capabilities.

It utilizes a custom Node.js/Express backend for handling AI services and persistent storage, requiring users to deploy and configure their own backend service.

✨ Key Features
AI Caption Generation: Utilizes the Gemini API (gemini-2.5-flash) to generate exactly 5 witty, contextually relevant captions for any uploaded image, returned strictly in JSON format.

AI Image Editing: Uses gemini-2.5-flash-image to apply descriptive text prompts directly onto the image canvas.

Multi-Language Support: Translated captions generated via Gemini based on user selection.

Interactive Canvas Editor: Users can add, position, resize, and style multiple text layers on the image.

Solana Integration & RPC: Finalization requires a Solana transaction via Wallet Adapter. This transaction communicates directly with the Carv Testnet RPC Endpoint for blockhash fetching and fee confirmation.

On-Chain Provenance (Hackathon Focus): Each creation is finalized by a 0.0001 SOL transaction fee sent to a specified receiver address, linking the creation on-chain via the Transaction Signature.

Persistent Storage: Processed images are saved to the server's filesystem (storage/images/) and served via a static route.

Community Gallery: A dynamic list of "Latest Creations" fetched from the backend API, showcasing recent community mints.



⚙️ Architecture & Configuration (User Setup Required)
The project is structured with a Frontend (Vite/React) and a Backend (Node.js/Express). Users MUST deploy/run the backend and configure the frontend to point to the correct backend IP and Fee Receiver Address.


1. Backend & Server Configuration (index.cjs)
The backend handles file I/O, API hosting, and acts as the gateway to the Gemini service (though the API key is in the frontend).

Backend IP & Port:
// index.cjs
const PORT = 3000;
const PUBLIC_IP = 'YOUR_SERVER_PUBLIC_IP'; // <<< MUST BE SET BY USER


Storage: The backend creates and manages storage/images/ and storage/data.json.
API Routes: Exposes /api/memes (GET) and /api/upload (POST).


2. Frontend Configuration (App.tsx, vite.config.ts, .env.local)
The frontend requires configuration for the external services.

Backend API URL: Must be updated in App.tsx:
// App.tsx
const ORACLE_IP = 'YOUR_SERVER_PUBLIC_IP'; // <<< MUST BE SET BY USER
const YOUR_BACKEND_API_URL = `http://${ORACLE_IP}:3000`;


Gemini API Key: Set in frontend .env.local file:
VITE_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY


Solana Fee Receiver: The hardcoded receiver address in App.tsx MUST be updated by the user to their own preferred address for receiving fees:

// App.tsx
const MEME_FEE_RECEIVER = 'YOUR_FEE_RECEIVER_ADDRESS'; // <<< MUST BE SET BY USER (Default: 8uacmx7yeMpCAzyhBfEDhNCuVG4VDrHYj8j2rLP6V6kp)
const TRANSFER_AMOUNT_SOL = 0.0001;


Browser Compatibility: Node.js module polyfills are configured in vite.config.ts to ensure client-side compatibility.

3. Core Data Structures (types.ts)
export interface Meme {
    id: string;
    imageUrl: string;        // Base64 (temp) or Final URL (saved)
    walletAddress: string;
    txSignature: string;
    creatorName: string;     // Meme Title / Creator Name
    createdAt: number;       // Unix timestamp
    feeAmount: number;       // SOL amount
}


🚀 Project Execution & Deployment
This project requires running two separate processes: the Backend API Server and the Frontend Development Server (Vite).

Step 1: Backend Deployment & Startup (On the Server/VM)
Once dependencies are installed (npm install in the backend directory), run the server persistently.

A. Persistent Background Service (Using nohup):
  # Navigate to the directory containing index.cjs
nohup node index.cjs > backend.log 2>&1 &

B. Persistent Interactive Session (Using screen):
# 1. Create and enter a new screen session named 'oracle_server'
screen -S oracle_server

# 2. Inside the new screen, run the server
node index.cjs 

# 3. Detach from the screen (Ctrl+A then D)

To re-attach later: screen -r oracle_server

Step 2: Frontend Development Server (Local Machine)
Start the frontend, ensuring the API URL in App.tsx points to your server's PUBLIC_IP.
# In the frontend directory
npm install
npm run dev

