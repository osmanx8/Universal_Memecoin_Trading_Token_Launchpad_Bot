import fs from 'fs';
import path from 'path';

export interface VanityKey {
  publicKey: string;
  secretKey: string;
  _id?: string;
  status?: 'available' | 'pending' | 'used';
  createdAt?: Date;
  usedAt?: Date;
}

export class VanityCacheService {
  private vanities: VanityKey[] = [];
  private pending: Map<string, VanityKey> = new Map(); // Track by publicKey
  private filePath: string;

  constructor() {
    this.filePath = path.join(__dirname, '../../vanity.json');
    this.loadVanities();
  }

  private loadVanities() {
    if (fs.existsSync(this.filePath)) {
      const data = fs.readFileSync(this.filePath, 'utf-8');
      const loadedVanities = JSON.parse(data);
      // Convert to proper format with status
      this.vanities = loadedVanities.map((v: any) => ({
        publicKey: v.publicKey,
        secretKey: v.secretKey,
        status: 'available',
        createdAt: new Date()
      }));
      console.log(`Loaded ${this.vanities.length} vanity keys into memory`);
    } else {
      this.vanities = [];
    }
  }

  private shuffle() {
    for (let i = this.vanities.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.vanities[i], this.vanities[j]] = [this.vanities[j], this.vanities[i]];
    }
  }

  grabVanity(): VanityKey | null {
    // Shuffle the available vanities
    this.shuffle();
    
    // Find first available vanity that's not pending
    const available = this.vanities.find(v => 
      v.status === 'available' && !this.pending.has(v.publicKey)
    );
    
    if (available) {
      // Mark as pending
      available.status = 'pending';
      this.pending.set(available.publicKey, available);
      console.log(`Grabbed vanity key: ${available.publicKey} (now pending)`);
      return available;
    }
    
    console.log('No available vanity keys found');
    return null;
  }

  confirmVanity(publicKey: string) {
    const pendingKey = this.pending.get(publicKey);
    if (pendingKey) {
      // Mark as used and remove from pending
      pendingKey.status = 'used';
      pendingKey.usedAt = new Date();
      this.pending.delete(publicKey);
      
      // Remove from available list
      this.vanities = this.vanities.filter(v => v.publicKey !== publicKey);
      
      console.log(`Confirmed vanity key: ${publicKey} (removed from pool)`);
    }
  }

  failVanity(publicKey: string) {
    const pendingKey = this.pending.get(publicKey);
    if (pendingKey) {
      // Mark as available again and remove from pending
      pendingKey.status = 'available';
      this.pending.delete(publicKey);
      
      console.log(`Failed vanity key: ${publicKey} (returned to pool)`);
    }
  }

  getAvailableVanities(): VanityKey[] {
    return this.vanities.filter(v => 
      v.status === 'available' && !this.pending.has(v.publicKey)
    );
  }

  getPendingVanities(): VanityKey[] {
    return Array.from(this.pending.values());
  }

  getUsedVanities(): VanityKey[] {
    return this.vanities.filter(v => v.status === 'used');
  }

  // Get stats for monitoring
  getStats() {
    return {
      total: this.vanities.length,
      available: this.getAvailableVanities().length,
      pending: this.pending.size,
      used: this.getUsedVanities().length
    };
  }
}

export const vanityCache = new VanityCacheService(); 