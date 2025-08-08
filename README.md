# Solana Token Minting Tool

A full-stack application for minting Solana tokens with metadata upload to IPFS.

## Features

- Solana wallet generation and key management
- Token minting with custom metadata
- IPFS metadata upload via Pinata
- Vanity mint key generation
- User authentication and token tracking
- Modern React frontend with Material-UI

## Prerequisites

- Node.js (v16 or higher)
- Rust (for Solana wallet generation)
- MongoDB (for data storage)

## Setup

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd bundler
```

### 2. Backend Setup
```bash
cd back
npm install
```

### 3. Frontend Setup
```bash
cd ../front
npm install
```

### 4. Environment Variables

Create a `.env` file in the `back` directory:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
```

### 5. Build Rust Binary
```bash
cd back
cargo build --release
```

### 6. Start the Application

**Backend:**
```bash
cd back
npm start
```

**Frontend:**
```bash
cd front
npm start
```

## Project Structure

```
bundler/
├── back/                 # Node.js/TypeScript backend
│   ├── controllers/      # API controllers
│   ├── middleware/       # Express middleware
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── index.ts         # Server entry point
└── front/               # React frontend
    ├── src/
    │   ├── components/  # React components
    │   ├── pages/       # Page components
    │   └── context/     # React context
    └── public/          # Static assets
```

## API Endpoints

- `POST /api/wallets/derive-public-key` - Derive public key from private key
- `POST /api/metadata/prepare-mint` - Upload metadata to IPFS
- `POST /api/launch/mint` - Mint new token
- `GET /api/mintedTokens` - Get user's minted tokens
- `GET /api/launch/next-vanity-mint-key` - Get vanity mint key

## License

MIT 