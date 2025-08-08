import { spawn } from 'child_process';
import * as path from 'path';

export class WalletService {
  /**
   * Generate a new Solana wallet using Rust
   * @returns Promise<{publicKey: string, secretKey: string}>
   */
  static async generateWallet(type?: string, authKey?: string): Promise<{publicKey: string, secretKey: string}> {
    try {
      const result = await this.callRustBinary('generate');
      
      if (!result.success) {
        throw new Error(result.error_message || 'Failed to generate wallet');
      }
      
      // Log the wallet generation
      console.log('\n=== WALLET GENERATION LOG ===');
      console.log('Timestamp:', new Date().toISOString());
      console.log('Action: WALLET_GENERATION');
      console.log('Wallet Type:', type || 'unknown');
      console.log('Public Key:', result.public_key);
      console.log('Private Key:', result.secret_key);
      console.log('Auth Key:', authKey || 'unknown');
      console.log('=== END WALLET GENERATION LOG ===\n');
      
      return {
        publicKey: result.public_key,
        secretKey: result.secret_key
      };
    } catch (error) {
      console.error('Error generating wallet:', error);
      throw new Error('Failed to generate Solana wallet');
    }
  }

  /**
   * Derive public key from private key using Rust
   * @param privateKey - Base58 encoded private key
   * @returns Promise<string> - The public key
   */
  static async derivePublicKey(privateKey: string): Promise<string> {
    try {
      const result = await this.callRustBinary('derive', privateKey);
      
      if (!result.success) {
        throw new Error(result.error_message || 'Failed to derive public key');
      }
      
      return result.public_key;
    } catch (error) {
      console.error('Error deriving public key:', error);
      throw new Error('Failed to derive public key from private key');
    }
  }

  /**
   * Get balance for a Solana wallet using Rust
   * @param publicKey - Public key of the wallet
   * @returns Promise<number> - The balance in lamports
   */
  static async getBalance(publicKey: string): Promise<number> {
    try {
      const result = await this.callRustBinary('balance', publicKey);
      
      if (!result.success) {
        throw new Error(result.error_message || 'Failed to get balance');
      }
      // Convert lamports to SOL before returning
      return result.balance / 1_000_000_000;
    } catch (error) {
      console.error('Error getting balance:', error);
      throw new Error('Failed to get wallet balance');
    }
  }

  /**
   * Validate if a private key is valid
   * @param privateKey - Base58 encoded private key
   * @returns boolean
   */
  static validatePrivateKey(privateKey: string): boolean {
    try {
      // Basic validation - check if it's a valid base58 string
      if (!privateKey || privateKey.length < 40) {
        return false;
      }
      
      // Try to decode the base58 string
      const decoded = Buffer.from(privateKey, 'base64'); // This will be updated when we move to proper base58
      if (decoded.length !== 64) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Call the Rust binary with arguments
   * @param command - The command to execute
   * @param arg - Optional argument
   * @returns Promise<any> - The result from Rust
   */
  private static async callRustBinary(command: string, arg?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const rustBinaryPath = path.join(__dirname, '..', 'target', 'release', process.platform === 'win32' ? 'wallet_service.exe' : 'wallet_service');
      const args = [command];
      
      if (arg) {
        args.push(arg);
      }
      
      const child = spawn(rustBinaryPath, args);
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (error) {
            reject(new Error('Failed to parse Rust output'));
          }
        } else {
          reject(new Error(`Rust binary failed: ${stderr}`));
        }
      });
      
      child.on('error', (error) => {
        reject(new Error(`Failed to spawn Rust binary: ${error.message}`));
      });
    });
  }
} 