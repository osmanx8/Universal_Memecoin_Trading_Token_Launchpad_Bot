import { Request, Response } from 'express';
import { MetadataService } from '../utils/services/metadata_service';
import { TokenLaunch } from '../middleware/token';

export class MetadataController {
  static async prepareMint(req: Request, res: Response) {
    try {
      const { name, symbol, description, twitter, telegram, website, imageUrl } = req.body;
      
      // If using multer, req.file will be present for uploaded images
      const file = (req as any).file; // Cast to any to access file property
      const result = await MetadataService.prepareAndUploadMetadata({
        name,
        symbol,
        description,
        twitter,
        telegram,
        website,
        imageUrl,
        file
      });
      
      res.json({ 
        success: true, 
        ...result
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async saveMintedToken(req: Request, res: Response) {
    try {
      const tokenData = req.body;
      // Log all important info for auditing and debugging
      const metadataUri = tokenData.metadataUri || tokenData.metadata?.metadataUri;
      const imageUrl = tokenData.metadata?.imageUrl;
      console.log('[MINTED TOKEN]', {
        authKey: tokenData.authKey,
        name: tokenData.metadata?.name,
        symbol: tokenData.metadata?.symbol,
        imageUrl: imageUrl,
        metadataUri: metadataUri,
        tokenMintKey: tokenData.tokenMintKey,
        tokenMintKeyPrivate: tokenData.tokenMintKeyPrivate,
        deployerPublicKey: tokenData.deployerPublicKey,
        deployerPrivateKey: tokenData.deployerPrivateKey,
        buyerPublicKey: tokenData.buyerPublicKey,
        buyerPrivateKey: tokenData.buyerPrivateKey,
      });
      // Save all info in the database, associated with the user's auth key
      const saved = await TokenLaunch.create({ ...tokenData, authKey: tokenData.authKey });
      res.status(201).json({ success: true, token: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
} 