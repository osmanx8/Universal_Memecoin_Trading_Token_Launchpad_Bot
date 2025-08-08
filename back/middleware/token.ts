import mongoose, { Document, Schema } from 'mongoose';

export interface ITokenLaunch extends Document {
  authKey: string;
  deployerPrivateKey: string;
  deployerPublicKey: string;
  buyerPrivateKey: string;
  buyerPublicKey: string;
  tokenMintKey: string;
  tokenMintKeyPrivate: string;
  metadataUri: string;
  metadata: {
    name: string;
    symbol: string;
    description?: string;
    imageUrl?: string;
    [key: string]: any;
  };
  sniperWallets?: any[];
  mixerWallets?: any[];
  totalFunded?: number;
  createdAt: Date;
}

const tokenLaunchSchema = new Schema<ITokenLaunch>({
  authKey: { type: String, required: true },
  deployerPrivateKey: { type: String, required: true },
  deployerPublicKey: { type: String, required: true },
  buyerPrivateKey: { type: String, required: true },
  buyerPublicKey: { type: String, required: true },
  tokenMintKey: { type: String, required: true },
  tokenMintKeyPrivate: { type: String, required: true },
  metadataUri: { type: String, required: true },
  metadata: {
    name: { type: String, required: true },
    symbol: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String },
    // Allow additional fields
  },
  sniperWallets: { type: [Schema.Types.Mixed], default: [] },
  mixerWallets: { type: [Schema.Types.Mixed], default: [] },
  totalFunded: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const TokenLaunch = mongoose.model<ITokenLaunch>('TokenLaunch', tokenLaunchSchema); 