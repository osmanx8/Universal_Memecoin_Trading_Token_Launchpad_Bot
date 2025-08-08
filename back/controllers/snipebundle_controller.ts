import { Request, Response } from 'express';
import { spawn } from 'child_process';
import * as path from 'path';



// Helper function to get sniper wallets for a mint
async function getSnipersForMint(mintId: string): Promise<any[]> {
  try {
    const { TokenLaunch } = require('../middleware/token');
    const tokenData = await TokenLaunch.findById(mintId);
    console.log(`🔍 Looking for sniper wallets for mint: ${mintId}`);
    console.log(`📊 Token data found:`, tokenData ? 'YES' : 'NO');
    if (tokenData) {
      console.log(`📋 Token fields:`, Object.keys(tokenData));
      console.log(`🎯 sniperWallets field:`, tokenData.sniperWallets ? 'EXISTS' : 'MISSING');
      if (tokenData.sniperWallets) {
        console.log(`📈 Number of sniper wallets:`, tokenData.sniperWallets.length);
      }
    }

    if (!tokenData || !tokenData.sniperWallets) {
      console.log(`❌ No sniper wallets found for mint ${mintId}`);
      return [];
    }
    console.log(`✅ Found ${tokenData.sniperWallets.length} sniper wallets for mint ${mintId}`);
    return tokenData.sniperWallets;
  } catch (error) {
    console.error('Error getting sniper wallets:', error);
    return [];
  }
}

// Helper function to send Jito bundle
async function sendJitoBundle(tokenMintKey: string, sniperWallets: any[], deployerPubkey: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const rustBinaryPath = path.join(__dirname, '..', 'target', 'release', process.platform === 'win32' ? 'snipebundle_service.exe' : 'snipebundle_service');
    const args = ['jito-bundle', tokenMintKey, JSON.stringify(sniperWallets), deployerPubkey];

    const child = spawn(rustBinaryPath, args);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log('Jito bundle stderr:', data.toString());
    });

    child.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          if (result.success) {
            resolve(result);
          } else {
            reject(new Error(result.error_message || 'Jito bundle failed'));
          }
        } catch (error) {
          reject(new Error('Failed to parse Jito bundle output: ' + error));
        }
      } else {
        reject(new Error(`Jito bundle binary failed: ${stderr}`));
      }
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to spawn Jito bundle binary: ${error.message}`));
    });
  });
}

async function getBuyerWalletBalance(buyerWallet: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const rustBinaryPath = path.join(__dirname, '..', 'target', 'release', process.platform === 'win32' ? 'snipebundle_service.exe' : 'snipebundle_service');
    const args = ['balance', buyerWallet];
    const child = spawn(rustBinaryPath, args);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    child.stderr.on('data', (data) => {
      stderr += data.toString();
      // Log stderr output to see transaction signatures
      console.log('Rust stderr:', data.toString());
    });
    child.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          if (typeof result.balance !== 'number') {
            return reject(new Error('Rust output missing balance'));
          }
          // Rust returns balance in SOL
          resolve(result.balance);
        } catch (error) {
          reject(new Error('Failed to parse Rust output: ' + error));
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

async function fundSnipersWithRust(numSnipers: number, totalBuyAmount: number, buyerPrivateKey: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const rustBinaryPath = path.join(__dirname, '..', 'target', 'release', process.platform === 'win32' ? 'snipebundle_service.exe' : 'snipebundle_service');
    const args = ['fund-snipers', numSnipers.toString(), totalBuyAmount.toString(), buyerPrivateKey];
    const child = spawn(rustBinaryPath, args);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    child.stderr.on('data', (data) => {
      stderr += data.toString();
      // Log stderr output to see transaction signatures
      console.log('Rust stderr:', data.toString());
    });
    child.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          reject(new Error('Failed to parse Rust output: ' + error));
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

export class SnipeBundleController {
  // POST /api/snipebundle/buyer-balance
  static async checkBuyerBalance(req: Request, res: Response) {
    const { buyerWallet, requiredAmount } = req.body;
    if (!buyerWallet || typeof buyerWallet !== 'string') {
      return res.status(400).json({ success: false, message: 'Missing or invalid buyerWallet' });
    }
    if (typeof requiredAmount !== 'number') {
      return res.status(400).json({ success: false, message: 'Missing or invalid requiredAmount' });
    }
    try {
      const balance = await getBuyerWalletBalance(buyerWallet);
      const hasEnough = balance >= requiredAmount;
      res.json({ success: true, balance, hasEnough });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // POST /api/snipebundle/fund-snipers
  static async fundSnipers(req: Request, res: Response) {
    const { numSnipers, totalBuyAmount, mintId, authKey } = req.body;
    console.log('fundSnipers called with:', { numSnipers, totalBuyAmount, mintId, authKey });
    if (!numSnipers || typeof numSnipers !== 'number') {
      return res.status(400).json({ success: false, message: 'Missing or invalid numSnipers' });
    }
    if (!totalBuyAmount || typeof totalBuyAmount !== 'number') {
      return res.status(400).json({ success: false, message: 'Missing or invalid totalBuyAmount' });
    }
    if (!mintId || typeof mintId !== 'string') {
      return res.status(400).json({ success: false, message: 'Missing or invalid mintId' });
    }
    if (!authKey || typeof authKey !== 'string') {
      return res.status(400).json({ success: false, message: 'Missing or invalid authKey' });
    }
    try {
      const { TokenLaunch } = require('../middleware/token');
      const token = await TokenLaunch.findOne({ _id: mintId });
      if (!token) {
        return res.status(404).json({ success: false, message: 'Token not found' });
      }
      if (!token.buyerPrivateKey) {
        return res.status(400).json({ success: false, message: 'Buyer wallet private key not found for this token' });
      }
      // Spawn Rust process
      const rustBinaryPath = path.join(__dirname, '..', 'target', 'release', process.platform === 'win32' ? 'snipebundle_service.exe' : 'snipebundle_service');
      const args = ['fund-snipers', numSnipers.toString(), totalBuyAmount.toString(), token.buyerPrivateKey];
      const child = spawn(rustBinaryPath, args);
      let stdout = '';
      let responded = false;
      let sniperWalletsSaved = false;

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      child.stderr.on('data', (data) => {
        const output = data.toString();
        // Parse the transaction signature
        const matchSig = output.match(/Buyer → Mixer \(wrapped\) transaction sent: ([A-Za-z0-9]+)/);
        if (matchSig && !responded) {
          const txSignature = matchSig[1];
          res.json({
            success: true,
            signature: txSignature,
            solscanUrl: `https://solscan.io/tx/${txSignature}`
          });
          responded = true;
        }
      });
      child.on('close', async (code) => {
        // After process closes, parse stdout for wallet info and save to database
        try {
          const result = JSON.parse(stdout);
          if (result && result.sniper_wallets && result.mixer_wallets && !sniperWalletsSaved) {
            console.log(`\n=== SNIPER WALLETS GENERATED ===`);
            result.sniper_wallets.forEach((wallet: any, index: number) => {
              console.log(`Sniper ${index + 1}:`);
              console.log(`  Public Key: ${wallet.public_key}`);
              console.log(`  Private Key: ${wallet.private_key}`);
            });
            console.log(`\n--- Mixer Wallet Details ---`);
            result.mixer_wallets.forEach((mixer: any, index: number) => {
              console.log(`Mixer ${index + 1}:`);
              console.log(`  Public Key: ${mixer.public_key}`);
              console.log(`  Private Key: ${mixer.private_key}`);
            });
            console.log(`\n=== END WALLETS ===\n`);

            // Save sniper wallets to database
            try {
              await TokenLaunch.findByIdAndUpdate(mintId, {
                sniperWallets: result.sniper_wallets,
                mixerWallets: result.mixer_wallets,
                totalFunded: result.total_funded
              });
              console.log(`✅ Sniper wallets saved to database for mint ${mintId}`);
              sniperWalletsSaved = true;
            } catch (dbError) {
              console.error('Failed to save sniper wallets to database:', dbError);
            }
          }
        } catch (e) {
          console.error('Failed to parse wallet info from Rust output:', e);
        }
      });
      child.on('error', (error) => {
        if (!responded) {
          res.status(500).json({ success: false, message: `Failed to spawn Rust binary: ${error.message}` });
          responded = true;
        }
      });
    } catch (e: any) {
      console.error('Error in fundSnipers:', e);
      console.error('Error stack:', e.stack);
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // POST /api/snipebundle/create-token
  static async createToken(req: Request, res: Response) {
    const { deployerPrivateKey, tokenMintPrivateKey, metadataUri, devBuyAmount, mintId } = req.body;

    // Debug logging
    console.log('Backend received create-token request:', {
      deployerPrivateKey: deployerPrivateKey ? '***PRESENT***' : 'MISSING',
      tokenMintPrivateKey: tokenMintPrivateKey ? '***PRESENT***' : 'MISSING',
      metadataUri: metadataUri || 'MISSING',
      devBuyAmount: devBuyAmount,
      mintId: mintId
    });

    if (!deployerPrivateKey || !tokenMintPrivateKey || typeof devBuyAmount !== 'number') {
      console.log('Validation failed - missing parameters');
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: deployerPrivateKey, tokenMintPrivateKey, devBuyAmount'
      });
    }

    try {
      // Get token info from database - mintId is required
      if (!mintId) {
        return res.status(400).json({ success: false, message: 'mintId is required' });
      }

      const { TokenLaunch } = require('../middleware/token');
      const tokenData = await TokenLaunch.findById(mintId);
      if (!tokenData) {
        return res.status(404).json({ success: false, message: 'Token not found' });
      }

      // Use the metadata URI from the database, not from the request
      const databaseMetadataUri = tokenData.metadataUri;
      if (!databaseMetadataUri) {
        return res.status(400).json({ success: false, message: 'Token metadata URI not found in database. Please prepare mint first.' });
      }

      // Prepare metadata for Rust
      const tokenName = tokenData.metadata?.name || 'Token';
      const tokenSymbol = tokenData.metadata?.symbol || 'TKN';
      const tokenDescription = tokenData.metadata?.description || 'Token created via Pump.fun';

      // Log token creation attempt
      console.log(`\n=== TOKEN CREATION ATTEMPT ===`);
      console.log(`Token Name: ${tokenName}`);
      console.log(`Token Symbol: ${tokenSymbol}`);
      console.log(`Token Description: ${tokenDescription}`);
      console.log(`Database Metadata URI: ${databaseMetadataUri}`);
      console.log(`Dev Buy Amount: ${devBuyAmount} SOL`);
      console.log(`Deployer Public Key: ${tokenData.deployerPublicKey || 'Unknown'}`);
      console.log(`Token Mint Public Key: ${tokenData.tokenMintKey || 'Unknown'}`);
      console.log(`=== END TOKEN CREATION ATTEMPT ===\n`);

      // Spawn Rust process for token creation
      const rustBinaryPath = path.join(__dirname, '..', 'target', 'release', process.platform === 'win32' ? 'snipebundle_service.exe' : 'snipebundle_service');
      const args = ['create-token', deployerPrivateKey, tokenMintPrivateKey, databaseMetadataUri, devBuyAmount.toString(), tokenName, tokenSymbol, tokenDescription];

      const child = spawn(rustBinaryPath, args);
      let stdout = '';
      let stderr = '';
      let responded = false;

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
        console.log('Rust stderr:', data.toString());
      });

      child.on('close', async (code) => {
        if (responded) return;

        // Log the full stderr output for debugging
        if (stderr) {
          console.log('\n=== RUST ERROR OUTPUT ===');
          console.log(stderr);
          console.log('=== END RUST ERROR OUTPUT ===\n');
        }

        try {
          const result = JSON.parse(stdout);
          if (result.success) {
            console.log(`\n=== TOKEN CREATION SUCCESS ===`);
            console.log(`Signature: ${result.signature}`);
            console.log(`Token: ${tokenData?.name || 'Unknown'}`);
            console.log(`Dev Buy Amount: ${devBuyAmount} SOL`);
            console.log(`=== END TOKEN CREATION ===\n`);

            // Get sniper wallets from database for this mintId
            const sniperWallets = await getSnipersForMint(mintId);

            if (sniperWallets && sniperWallets.length > 0) {
              console.log(`\n=== JITO BUNDLE ATTEMPT ===`);
              console.log(`Found ${sniperWallets.length} sniper wallets for mint ${mintId}`);
              console.log(`Token mint: ${tokenData.tokenMintKey}`);

              // Call Jito bundle logic
              try {
                const bundleResult = await sendJitoBundle(tokenData.tokenMintKey, sniperWallets, tokenData.deployerPublicKey);
                console.log(`Jito bundle sent successfully! Bundle ID: ${bundleResult.bundle_id}`);
                console.log(`=== END JITO BUNDLE SUCCESS ===\n`);

                res.json({
                  success: true,
                  signature: result.signature,
                  solscanUrl: `https://solscan.io/tx/${result.signature}`,
                  jitoBundle: {
                    success: true,
                    bundle_id: bundleResult.bundle_id,
                    sniper_count: sniperWallets.length
                  }
                });
              } catch (bundleError: any) {
                console.log(`Jito bundle failed: ${bundleError.message}`);
                console.log(`=== END JITO BUNDLE FAILED ===\n`);

                // Still return success for token creation, but include bundle error
                res.json({
                  success: true,
                  signature: result.signature,
                  solscanUrl: `https://solscan.io/tx/${result.signature}`,
                  jitoBundle: {
                    success: false,
                    error: bundleError.message
                  }
                });
              }
            } else {
              console.log(`No sniper wallets found for mint ${mintId}`);
              console.log(`=== END TOKEN CREATION (NO SNIPERS) ===\n`);

              res.json({
                success: true,
                signature: result.signature,
                solscanUrl: `https://solscan.io/tx/${result.signature}`,
                jitoBundle: {
                  success: false,
                  error: "No sniper wallets found"
                }
              });
            }
          } else {
            console.log('\n=== TOKEN CREATION FAILED ===');
            console.log(`Error: ${result.error_message}`);
            console.log(`Rust stderr: ${stderr}`);
            console.log('=== END TOKEN CREATION FAILED ===\n');

            res.status(500).json({
              success: false,
              message: result.error_message || 'Token creation failed',
              rustError: stderr
            });
          }
        } catch (error) {
          console.log('\n=== PARSE ERROR ===');
          console.log(`Failed to parse Rust output: ${error}`);
          console.log(`Rust stdout: ${stdout}`);
          console.log(`Rust stderr: ${stderr}`);
          console.log('=== END PARSE ERROR ===\n');

          res.status(500).json({
            success: false,
            message: 'Failed to parse Rust output: ' + error,
            rustError: stderr,
            rustOutput: stdout
          });
        }
        responded = true;
      });

      child.on('error', (error) => {
        if (!responded) {
          res.status(500).json({
            success: false,
            message: `Failed to spawn Rust binary: ${error.message}`
          });
          responded = true;
        }
      });

    } catch (error: any) {
      console.error('Error in createToken:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/snipebundle/get-snipers/:mintId
  static async getSnipers(req: Request, res: Response) {
    const { mintId } = req.params;

    if (!mintId) {
      return res.status(400).json({ success: false, message: 'Missing mintId parameter' });
    }

    try {
      const sniperWallets = await getSnipersForMint(mintId);
      res.json({
        success: true,
        sniperWallets,
        count: sniperWallets.length
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
} 