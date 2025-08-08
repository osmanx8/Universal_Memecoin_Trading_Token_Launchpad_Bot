# 🚀Universal Memecoin Trading Token Launchpad Bot

🌟A full-stack application for minting Solana memecoint tokens with metadata upload to IPFS.
With Bonkfun and Pumpfun fork launchpad including universal bots, 
User-friendly customized token launch, universal trading bots
Tech-Typescript Rust Mongodb
#Pump AMM 
#Raydium V4
#Raydium CPMM
#Raydium CLMM
#Meteora DLMM 
#Meteora Dynamic AMM
#Meteora DAMM V2
#Ocra 
#Solfi 
#Vertigo 
#Bonkfun
@Bundler @sniper @volume @copy-trading 

## Features

- Solana wallet generation and key management
- Token minting with custom metadata
- IPFS metadata upload via Pinata
- Vanity mint key generation
- User authentication and token tracking
- Modern React frontend with Material-UI
<img src="https://raw.githubusercontent.com/osmanx8/Universal_Memecoin_Trading_Token_Launchpad_Bot/main/assets/bot(1).png" alt="bot1" />
<img src="https://raw.githubusercontent.com/osmanx8/Universal_Memecoin_Trading_Token_Launchpad_Bot/main/assets/bot(2).png" alt="bot2" />
<img src="https://raw.githubusercontent.com/osmanx8/Universal_Memecoin_Trading_Token_Launchpad_Bot/main/assets/bot(3).png" alt="bot3" />

## Prerequisites

- Node.js (v16 or higher)
-Typescript
- Rust (for Solana wallet generation)
- MongoDB (for data storage)


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
