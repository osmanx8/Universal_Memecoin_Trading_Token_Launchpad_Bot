import { Request, Response } from 'express';
import { vanityCache } from '../utils/services/vanity_cache_service';

export class VanityController {
  static async getNextVanityMintKey(req: Request, res: Response) {
    const vanity = vanityCache.grabVanity();
    if (vanity) {
      res.json({ 
        success: true, 
        data: { 
          publicKey: vanity.publicKey, 
          secretKey: vanity.secretKey 
        } 
      });
    } else {
      res.status(404).json({ success: false, error: 'No available vanity mint keys.' });
    }
  }

  static async confirmVanityUsage(req: Request, res: Response) {
    const { publicKey } = req.body;
    if (!publicKey) {
      return res.status(400).json({ success: false, error: 'Public key is required' });
    }
    
    try {
      vanityCache.confirmVanity(publicKey);
      res.json({ success: true, message: 'Vanity key confirmed and removed from pool' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to confirm vanity usage' });
    }
  }

  static async failVanityUsage(req: Request, res: Response) {
    const { publicKey } = req.body;
    if (!publicKey) {
      return res.status(400).json({ success: false, error: 'Public key is required' });
    }
    
    try {
      vanityCache.failVanity(publicKey);
      res.json({ success: true, message: 'Vanity key returned to pool' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fail vanity usage' });
    }
  }

  static async getVanityStats(req: Request, res: Response) {
    try {
      const stats = vanityCache.getStats();
      res.json({ success: true, stats });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to get vanity stats' });
    }
  }
} 