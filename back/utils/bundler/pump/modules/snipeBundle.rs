use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    system_instruction,
    transaction::{Transaction, VersionedTransaction},
};
use spl_token::{
    instruction::{close_account, sync_native},
    native_mint::ID as NATIVE_MINT,
};
use spl_associated_token_account::{
    get_associated_token_address,
    instruction::create_associated_token_account_idempotent,
};
use std::env;
use rand::Rng;
use bs58;
// Removed unused import: RpcSignatureStatusConfig
use solana_sdk::commitment_config::CommitmentConfig;
use solana_program::{
    instruction::{Instruction, AccountMeta},
    system_program,
};

use std::str::FromStr;
use reqwest;
use serde_json::{json, Value};
use base64::{Engine, engine::general_purpose::STANDARD};
use std::time::Duration;
use tokio::time::sleep;

// Pump.fun constants
pub const PUMP_PROGRAM_ID: &str = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
pub const PUMP_GLOBAL: &str = "4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf";
pub const PUMP_EVENT_AUTHORITY: &str = "Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1";
pub const PUMP_FEE_ACCOUNT: &str = "4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf";
pub const MINT_AUTHORITY: &str = "TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM";
pub const METAPLEX_PROGRAM_ID: &str = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
pub const FEE_RECIPIENT: &str = "CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM";

pub const RPC_ENDPOINT: &str = "https://api.mainnet-beta.solana.com";

// Jito Bundle Constants
pub const JITO_BLOCK_ENGINE_URL: &str = "https://ny.mainnet.block-engine.jito.wtf";
pub const JITO_BUNDLE_ENDPOINT: &str = "/api/v1/bundles";
pub const JITO_MIN_TIP_LAMPORTS: u64 = 1000; // Minimum 1000 lamports tip
pub const JITO_DEFAULT_TIP_LAMPORTS: u64 = 10000; // 0.00001 SOL default tip
pub const JITO_MAX_TRANSACTIONS_PER_BUNDLE: usize = 5;
pub const JITO_MAX_WALLETS_PER_TRANSACTION: usize = 5;
pub const JITO_POLL_INTERVAL_MS: u64 = 20; // Poll every 20ms for fast confirmation
pub const JITO_MAX_POLL_ATTEMPTS: u32 = 150; // 3 seconds max (150 * 20ms)

// Helius RPC for fast polling
pub const HELIUS_RPC_URL: &str = "https://mainnet.helius-rpc.com/?api-key=a8769523-bf96-4884-bcc0-cf79af6acce3";

const CREATOR_VAULT_SEED: &[u8] = b"creator-vault";

const FEE_DENOMINATOR: u64 = 10000;
const FEE_BPS: u64 = 100; // 1% fee

/// Get RPC URL from config or use default
fn get_rpc_url() -> String {
    RPC_ENDPOINT.to_string()
}

fn get_creator_vault_pda(creator: &Pubkey) -> Option<Pubkey> {
    let seeds: &[&[u8]; 2] = &[CREATOR_VAULT_SEED, creator.as_ref()];
    let program_id = Pubkey::from_str(PUMP_PROGRAM_ID).unwrap();
    let pda: Option<(Pubkey, u8)> = Pubkey::try_find_program_address(seeds, &program_id);
    pda.map(|pubkey| pubkey.0)
}


/// Calculate total funding needed including fees
fn calculate_total_funding_needed(num_snipers: usize, total_buy_amount: f64) -> f64 {
    let base_funding = total_buy_amount;
    let fee_per_sniper = 0.1; // 0.1 SOL per sniper for transaction fees
    let total_fees = num_snipers as f64 * fee_per_sniper;
    base_funding + total_fees
}

fn get_amount_out(amount_in: u64, reserve_a: u64, reserve_b: u64) -> (u64, u64, u64) {
    let amount_in_128 = amount_in as u128;
    let reserve_a_128 = reserve_a as u128;
    let reserve_b_128 = reserve_b as u128;
    // Use exact amount - Pump.fun protocol handles the fee automatically
    let numerator = amount_in_128 * reserve_b_128;
    let denominator = reserve_a_128 + amount_in_128;
    let amount_out = numerator / denominator;
    (
        amount_out as u64,
        (reserve_a_128 + amount_in_128) as u64,
        (reserve_b_128 - amount_out) as u64,
    )
}

#[derive(serde::Serialize)]
struct BalanceResult {
    balance: f64,
    success: bool,
    error_message: Option<String>,
}

#[derive(serde::Serialize, serde::Deserialize)]
struct SniperWallet {
    public_key: String,
    private_key: String,
    buy_amount: f64,
}

#[derive(serde::Serialize)]
struct MixerWallet {
    public_key: String,
    private_key: String,
    sniper_index: usize,
}

#[derive(serde::Serialize)]
struct FundSnipersResult {
    success: bool,
    sniper_wallets: Vec<SniperWallet>,
    mixer_wallets: Vec<MixerWallet>,
    total_funded: f64,
    error_message: Option<String>,
}

fn main() {
    let args: Vec<String> = env::args().collect();
    
    if args.len() < 3 {
        eprintln!("Usage: {} <command> [args...]", args[0]);
        eprintln!("Commands:");
        eprintln!("  balance <wallet_address>");
        eprintln!("  fund-snipers <num_snipers> <total_buy_amount> <buyer_private_key>");
        eprintln!("  buyer-pubkey <buyer_private_key>");
        eprintln!("  create-token <deployer_private_key> <token_mint_private_key> <metadata_uri> <dev_buy_amount> <token_name> <token_symbol> <token_description>");
        eprintln!("  jito-bundle <token_mint> <sniper_wallets_json>");
        std::process::exit(1);
    }
    
    let command = &args[1];
    let result = match command.as_str() {
        "balance" => {
            if args.len() < 3 {
                eprintln!("Usage: {} balance <wallet_address>", args[0]);
                std::process::exit(1);
            }
            let wallet_address = &args[2];
            let balance_result = get_buyer_wallet_balance_cli(wallet_address);
            serde_json::to_string(&balance_result).unwrap()
        },
        "fund-snipers" => {
            if args.len() < 5 {
                eprintln!("Usage: {} fund-snipers <num_snipers> <total_buy_amount> <buyer_private_key>", args[0]);
                std::process::exit(1);
            }
            let num_snipers: usize = args[2].parse().unwrap_or(0);
            let total_buy_amount: f64 = args[3].parse().unwrap_or(0.0);
            let buyer_private_key = &args[4];
            let fund_result = fund_snipers_cli(num_snipers, total_buy_amount, buyer_private_key);
            serde_json::to_string(&fund_result).unwrap()
        },
        "buyer-pubkey" => {
            if args.len() < 3 {
                eprintln!("Usage: {} buyer-pubkey <buyer_private_key>", args[0]);
                std::process::exit(1);
            }
            let buyer_private_key = &args[2];
            let pubkey = match bs58::decode(buyer_private_key).into_vec() {
                Ok(bytes) => {
                    if bytes.len() != 64 {
                        return println!("{{\"success\":false,\"error_message\":\"Invalid private key length\"}}");
                    }
                    match solana_sdk::signature::Keypair::from_bytes(&bytes) {
                        Ok(kp) => kp.pubkey().to_string(),
                        Err(_) => return println!("{{\"success\":false,\"error_message\":\"Invalid private key format\"}}")
                    }
                },
                Err(_) => return println!("{{\"success\":false,\"error_message\":\"Failed to decode private key\"}}")
            };
            println!("{{\"success\":true,\"public_key\":\"{}\"}}", pubkey);
            String::new()
        },
        "create-token" => {
            if args.len() < 9 {
                eprintln!("Usage: {} create-token <deployer_private_key> <token_mint_private_key> <metadata_uri> <dev_buy_amount> <token_name> <token_symbol> <token_description>", args[0]);
                std::process::exit(1);
            }
            let deployer_private_key = &args[2];
            eprintln!("deployer_private_key: {}", deployer_private_key);
            let token_mint_private_key = &args[3];
            let metadata_uri = &args[4];
            let dev_buy_amount: f64 = args[5].parse().unwrap_or(0.0);
            let token_name = &args[6];
            let token_symbol = &args[7];
            let token_description = &args[8];
            
            // Validate that deployer and token mint are different
            let deployer_keypair = match bs58::decode(deployer_private_key).into_vec() {
                Ok(bytes) => {
                    if bytes.len() != 64 {
                        return println!("{{\"success\":false,\"error_message\":\"Invalid deployer private key length\"}}");
                    }
                    match Keypair::from_bytes(&bytes) {
                        Ok(kp) => kp,
                        Err(_) => return println!("{{\"success\":false,\"error_message\":\"Invalid deployer private key format\"}}")
                    }
                },
                Err(_) => return println!("{{\"success\":false,\"error_message\":\"Failed to decode deployer private key\"}}")
            };

            let token_mint_keypair = match bs58::decode(token_mint_private_key).into_vec() {
                Ok(bytes) => {
                    if bytes.len() != 64 {
                        return println!("{{\"success\":false,\"error_message\":\"Invalid token mint private key length\"}}");
                    }
                    match Keypair::from_bytes(&bytes) {
                        Ok(kp) => kp,
                        Err(_) => return println!("{{\"success\":false,\"error_message\":\"Invalid token mint private key format\"}}")
                    }
                },
                Err(_) => return println!("{{\"success\":false,\"error_message\":\"Failed to decode token mint private key\"}}")
            };
            
            if deployer_keypair.pubkey() == token_mint_keypair.pubkey() {
                return println!("{{\"success\":false,\"error_message\":\"Deployer and token mint must have different public keys. Please use different private keys.\"}}");
            }
            
            let create_result = create_token_cli(deployer_private_key, token_mint_private_key, metadata_uri, dev_buy_amount, token_name, token_symbol, token_description);
            serde_json::to_string(&create_result).unwrap()
        },
        "jito-bundle" => {
            if args.len() < 4 {
                eprintln!("Usage: {} jito-bundle <token_mint> <sniper_wallets_json>", args[0]);
                std::process::exit(1);
            }
            let token_mint = &args[2];
            let sniper_wallets_json = &args[3];
            
            match test_jito_bundle_cli(token_mint, sniper_wallets_json) {
                Ok(bundle_id) => format!("{{\"success\":true,\"bundle_id\":\"{}\"}}", bundle_id),
                Err(e) => format!("{{\"success\":false,\"error_message\":\"{}\"}}", e)
            }
        },
        _ => {
            eprintln!("Unknown command: {}", command);
            std::process::exit(1);
        }
    };
    
    // Output result as JSON
    println!("{}", result);
}

/// Checks the SOL balance of the given buyer wallet address using the Solana mainnet RPC.
/// Returns the balance in SOL (f64) or an error.
pub fn get_buyer_wallet_balance(buyer_wallet: &str) -> Result<f64, Box<dyn std::error::Error>> {
    let rpc_url = get_rpc_url();
    let client = RpcClient::new(rpc_url);
    let pubkey = buyer_wallet.parse::<Pubkey>()?;
    let balance = client.get_balance(&pubkey)?;
    Ok(balance as f64 / 1_000_000_000.0)
}

/// CLI wrapper for get_buyer_wallet_balance that returns JSON
fn get_buyer_wallet_balance_cli(buyer_wallet: &str) -> BalanceResult {
    match get_buyer_wallet_balance(buyer_wallet) {
        Ok(balance) => BalanceResult {
            balance,
            success: true,
            error_message: None,
        },
        Err(e) => BalanceResult {
            balance: 0.0,
            success: false,
            error_message: Some(e.to_string()),
        }
    }
}

/// Generate random increasing amounts that sum to exactly total_amount
fn calculate_sniper_amounts(num_snipers: usize, total_amount: f64) -> Vec<f64> {
    let mut rng = rand::thread_rng();
    let base_amount = total_amount / num_snipers as f64;
    let variation_range = base_amount * 0.3; // ±30% variation
    
    let mut amounts = Vec::new();
    let mut remaining = total_amount;
    
    for i in 0..num_snipers {
        let is_last = i == num_snipers - 1;
        
        if is_last {
            // Last sniper gets remaining amount to ensure exact sum
            amounts.push(remaining);
        } else {
            // Random amount within variation range
            let min_amount = (base_amount - variation_range).max(0.01);
            let max_amount = (base_amount + variation_range).min(remaining - (num_snipers - i - 1) as f64 * 0.01);
            
            let amount = rng.gen_range(min_amount..=max_amount);
            amounts.push(amount);
            remaining -= amount;
        }
    }
    
    // Sort from least to greatest
    amounts.sort_by(|a, b| a.partial_cmp(b).unwrap());
    amounts
}

/// Generate sniper wallets and calculate funding amounts with WSOL wrapping
fn fund_snipers_cli(num_snipers: usize, total_buy_amount: f64, buyer_private_key: &str) -> FundSnipersResult {
    // Parse buyer private key
    let buyer_keypair = match bs58::decode(buyer_private_key).into_vec() {
        Ok(bytes) => {
            if bytes.len() != 64 {
                return FundSnipersResult {
                    success: false,
                    sniper_wallets: Vec::new(),
                    mixer_wallets: Vec::new(),
                    total_funded: 0.0,
                    error_message: Some("Invalid buyer private key length".to_string()),
                };
            }
            match Keypair::from_bytes(&bytes) {
                Ok(kp) => kp,
                Err(_) => return FundSnipersResult {
                    success: false,
                    sniper_wallets: Vec::new(),
                    mixer_wallets: Vec::new(),
                    total_funded: 0.0,
                    error_message: Some("Invalid buyer private key format".to_string()),
                }
            }
        },
        Err(_) => return FundSnipersResult {
            success: false,
            sniper_wallets: Vec::new(),
            mixer_wallets: Vec::new(),
            total_funded: 0.0,
            error_message: Some("Failed to decode buyer private key".to_string()),
        }
    };
    
    // Calculate total funding needed (buy amount + fees)
    let total_funding_needed = calculate_total_funding_needed(num_snipers, total_buy_amount);
    eprintln!("Total funding needed: {} SOL ({} buy amount + {} fees)", 
        total_funding_needed, total_buy_amount, total_funding_needed - total_buy_amount);
    
    // Calculate random increasing amounts that sum to exactly total_buy_amount
    let buy_amounts = calculate_sniper_amounts(num_snipers, total_buy_amount);
    eprintln!("Calculated buy amounts: {:?}", buy_amounts);
    
    // Generate sniper wallets
    let mut sniper_wallets = Vec::new();
    let mut mixer_wallets = Vec::new();
    
    for (i, buy_amount) in buy_amounts.iter().enumerate() {
        // Generate sniper wallet
        let sniper_keypair = Keypair::new();
        let sniper_wallet = SniperWallet {
            public_key: sniper_keypair.pubkey().to_string(),
            private_key: bs58::encode(&sniper_keypair.to_bytes()).into_string(),
            buy_amount: *buy_amount,
        };
        sniper_wallets.push(sniper_wallet);
        
        // Generate mixer wallet for this sniper
        let mixer_keypair = Keypair::new();
        let mixer_wsol_account = get_associated_token_address(&mixer_keypair.pubkey(), &NATIVE_MINT);
        let mixer_wallet = MixerWallet {
            public_key: mixer_wsol_account.to_string(), // The actual mixer (wSOL account)
            private_key: bs58::encode(&mixer_keypair.to_bytes()).into_string(), // Signer's private key
            sniper_index: i,
        };
        mixer_wallets.push(mixer_wallet);
    }
    // Log all sniper and mixer wallet keys immediately
    eprintln!("\n=== SNIPER WALLETS GENERATED (INSTANT) ===");
    for (i, wallet) in sniper_wallets.iter().enumerate() {
        eprintln!("Sniper {}:", i + 1);
        eprintln!("  Public Key: {}", wallet.public_key);
        eprintln!("  Private Key: {}", wallet.private_key);
    }
    eprintln!("\n--- Mixer Wallet Details (INSTANT) ---");
    for (i, mixer) in mixer_wallets.iter().enumerate() {
        eprintln!("Mixer {}:", i + 1);
        eprintln!("  Public Key: {}", mixer.public_key);
        eprintln!("  Private Key: {}", mixer.private_key);
    }
    eprintln!("\n=== END WALLETS (INSTANT) ===\n");
    
    let rpc_url = get_rpc_url();
    eprintln!("Using RPC endpoint: {}", rpc_url);
    let client = RpcClient::new(rpc_url);
    
    // Get buyer's current balance
    let buyer_balance = match client.get_balance(&buyer_keypair.pubkey()) {
        Ok(balance) => balance as f64 / 1_000_000_000.0,
        Err(e) => return FundSnipersResult {
            success: false,
            sniper_wallets: Vec::new(),
            mixer_wallets: Vec::new(),
            total_funded: 0.0,
            error_message: Some(format!("Failed to get buyer balance: {}", e)),
        }
    };
    
    if buyer_balance < total_funding_needed {
        return FundSnipersResult {
            success: false,
            sniper_wallets: Vec::new(),
            mixer_wallets: Vec::new(),
            total_funded: 0.0,
            error_message: Some(format!("Insufficient balance. Need {} SOL, have {} SOL", total_funding_needed, buyer_balance)),
        }
    }
    
    // Build and send transactions using wrap-send-unwrap pattern for obfuscation
    
    for (i, sniper_wallet) in sniper_wallets.iter().enumerate() {
        let mixer_wallet = &mixer_wallets[i];
        
        // Parse sniper and mixer keypairs
        let sniper_keypair = match bs58::decode(&sniper_wallet.private_key).into_vec() {
            Ok(bytes) => match Keypair::from_bytes(&bytes) {
                Ok(kp) => kp,
                Err(_) => continue,
            },
            Err(_) => continue,
        };
        
        let mixer_keypair = match bs58::decode(&mixer_wallet.private_key).into_vec() {
            Ok(bytes) => match Keypair::from_bytes(&bytes) {
                Ok(kp) => kp,
                Err(_) => continue,
            },
            Err(_) => continue,
        };
        
        // Send calculated buy amount + 0.1 SOL for fees to each sniper
        let amount_to_send = sniper_wallet.buy_amount + 0.1; // Buy amount + 0.1 SOL for fees
        let lamports = (amount_to_send * 1_000_000_000.0) as u64;
        
        // Step 1: Buyer creates mixer, funds it, wraps SOL, and closes mixer account (ALL IN ONE TX)
        eprintln!("Creating single transaction: create mixer → fund → wrap → close → send to sniper");
        eprintln!("Amount: {} lamports ({} SOL)", lamports, amount_to_send);
        
        let mut instructions = Vec::new();
        
        // Create mixer's wSOL account (like "Create CjoP7k...6ntY2K with deposit")
        let mixer_wsol_account = get_associated_token_address(&mixer_keypair.pubkey(), &NATIVE_MINT);
        let create_mixer_wsol = create_associated_token_account_idempotent(
            &buyer_keypair.pubkey(),
            &mixer_keypair.pubkey(),
            &NATIVE_MINT,
            &spl_token::id(),
        );
        instructions.push(create_mixer_wsol);
        
        // Transfer SOL to mixer's wSOL account (like "Transfer 17.95294228 SOL to CjoP7k...6ntY2K")
        let transfer_sol_to_mixer_wsol = system_instruction::transfer(
            &buyer_keypair.pubkey(),
            &mixer_wsol_account,
            lamports
        );
        instructions.push(transfer_sol_to_mixer_wsol);
        
        // Wrap SOL to wSOL in mixer (like "Wrap 17.95498156 SOL to CjoP7k...6ntY2K")
        let sync_native_ix = sync_native(
            &spl_token::id(),
            &mixer_wsol_account,
        ).unwrap();
        instructions.push(sync_native_ix);
        
        // Close mixer's wSOL account and send all SOL to sniper (like "Close Token Account CjoP7k...6ntY2K and redeem to BLNGjo...FpUAbv")
        let close_mixer_wsol = close_account(
            &spl_token::id(),
            &mixer_wsol_account,
            &sniper_keypair.pubkey(), // Send all SOL (including rent) to sniper
            &mixer_keypair.pubkey(),  // Authority
            &[],
        ).unwrap();
        instructions.push(close_mixer_wsol);
        
        // Build transaction
        let blockhash = client.get_latest_blockhash().unwrap();
        let wrap_send_unwrap_tx = Transaction::new_signed_with_payer(
            &instructions,
            Some(&buyer_keypair.pubkey()),
            &[&buyer_keypair, &mixer_keypair],
            blockhash
        );
        
        eprintln!("Successfully created wrap-send-unwrap transaction with {} instructions", instructions.len());
        
        // Send wrap-send-unwrap transaction and check status
        match client.send_transaction(&wrap_send_unwrap_tx) {
            Ok(sig) => {
                eprintln!("Buyer → Mixer (wrapped) transaction sent: {}", sig);
                
                // Wait for transaction confirmation (check for confirmed status, not finalized)
                let mut attempts = 0;
                let max_attempts = 20; // 2 seconds max (20 * 100ms) - much faster!
                let mut transaction_confirmed = false;
                
                while attempts < max_attempts {
                    match client.get_signature_status_with_commitment(&sig, CommitmentConfig::confirmed()) {
                        Ok(Some(status)) => {
                            let err = status.err();
                            if err.is_none() {
                                eprintln!("Transaction confirmed (confirmed commitment)! ({} seconds)", attempts as f32 * 0.1);
                                transaction_confirmed = true;
                                break;
                            } else {
                                eprintln!("Transaction failed with error: {:?}", err);
                                break;
                            }
                        },
                        Ok(None) => {
                            // Transaction still processing
                            attempts += 1;
                            std::thread::sleep(std::time::Duration::from_millis(100));
                        },
                        Err(e) => {
                            eprintln!("Failed to check transaction status: {}", e);
                            attempts += 1;
                            std::thread::sleep(std::time::Duration::from_millis(100));
                        }
                    }
                }
                
                if !transaction_confirmed {
                    eprintln!("Transaction did not confirm within timeout");
                    continue;
                }
                
                // Transaction completed successfully - sniper received funds and mixer account is closed
                eprintln!("Single transaction completed - sniper should have received {} SOL", amount_to_send);
                eprintln!("Mixer account is now closed with zero balance");
            },
            Err(e) => {
                eprintln!("Buyer → Mixer (wrapped) transaction failed to send: {}", e);
                eprintln!("Error details: {:?}", e);
                eprintln!("This could be due to insufficient funds, network issues, or program errors");
                continue;
            },
        }
    }
    
    FundSnipersResult {
        success: true,
        sniper_wallets,
        mixer_wallets,
        total_funded: total_buy_amount,
        error_message: None,
    }
}

// Token creation result structure
#[derive(serde::Serialize)]
struct TokenCreationResult {
    success: bool,
    signature: Option<String>,
    error_message: Option<String>,
}

// Token creation function
fn create_token_cli(
    deployer_private_key: &str,
    token_mint_private_key: &str,
    metadata_uri: &str,
    dev_buy_amount: f64,
    token_name: &str,
    token_symbol: &str,
    _token_description: &str,
) -> TokenCreationResult {
    // Parse private keys
    let deployer_keypair = match bs58::decode(deployer_private_key).into_vec() {
        Ok(bytes) => {
            if bytes.len() != 64 {
                return TokenCreationResult {
                    success: false,
                    signature: None,
                    error_message: Some("Invalid deployer private key length".to_string()),
                };
            }
            match Keypair::from_bytes(&bytes) {
                Ok(kp) => kp,
                Err(_) => return TokenCreationResult {
                    success: false,
                    signature: None,
                    error_message: Some("Invalid deployer private key format".to_string()),
                }
            }
        },
        Err(_) => return TokenCreationResult {
            success: false,
            signature: None,
            error_message: Some("Failed to decode deployer private key".to_string()),
        }
    };

    let token_mint_keypair = match bs58::decode(token_mint_private_key).into_vec() {
        Ok(bytes) => {
            if bytes.len() != 64 {
                return TokenCreationResult {
                    success: false,
                    signature: None,
                    error_message: Some("Invalid token mint private key length".to_string()),
                };
            }
            match Keypair::from_bytes(&bytes) {
                Ok(kp) => kp,
                Err(_) => return TokenCreationResult {
                    success: false,
                    signature: None,
                    error_message: Some("Invalid token mint private key format".to_string()),
                }
            }
        },
        Err(_) => return TokenCreationResult {
            success: false,
            signature: None,
            error_message: Some("Failed to decode token mint private key".to_string()),
        }
    };

    let rpc_url = get_rpc_url();
    let client = RpcClient::new(rpc_url);

    // Create token creation instruction (includes dev buy)
    let token_instructions = match create_token_creation_instruction(
        &deployer_keypair,
        &token_mint_keypair,
        metadata_uri,
        dev_buy_amount,
        token_name,
        token_symbol,
        _token_description,
    ) {
        Ok(instructions) => instructions,
        Err(e) => return TokenCreationResult {
            success: false,
            signature: None,
            error_message: Some(format!("Failed to create token instruction: {}", e)),
        }
    };

    // Build and send transaction
    let blockhash = match client.get_latest_blockhash() {
        Ok(bh) => bh,
        Err(e) => return TokenCreationResult {
            success: false,
            signature: None,
            error_message: Some(format!("Failed to get latest blockhash: {}", e)),
        }
    };

    let transaction = Transaction::new_signed_with_payer(
        &token_instructions,
        Some(&deployer_keypair.pubkey()),
        &[&deployer_keypair, &token_mint_keypair],
        blockhash
    );

    // First simulate the transaction to get detailed error logs
    eprintln!("Simulating transaction...");
    match client.simulate_transaction(&transaction) {
        Ok(sim_result) => {
            if let Some(err) = sim_result.value.err {
                eprintln!("Token Creation Transaction simulation failed: {:?}", err);
                eprintln!("Simulation logs: {:?}", sim_result.value.logs);
                return TokenCreationResult {
                    success: false,
                    signature: None,
                    error_message: Some(format!("Transaction simulation failed: {:?}", err)),
                };
            } else {
                eprintln!("Transaction simulation successful");
            }
        },
        Err(e) => {
            eprintln!("Failed to simulate transaction: {}", e);
            return TokenCreationResult {
                success: false,
                signature: None,
                error_message: Some(format!("Failed to simulate transaction: {}", e)),
            };
        }
    }

    // Send transaction
    match client.send_transaction(&transaction) {
        Ok(signature) => {
            eprintln!("Token creation transaction sent: {}", signature);
            
            // Wait for confirmation
            let mut attempts = 0;
            let max_attempts = 30;
            let mut transaction_confirmed = false;
            
            while attempts < max_attempts {
                match client.get_signature_status_with_commitment(&signature, CommitmentConfig::confirmed()) {
                    Ok(Some(status)) => {
                        let err = status.err();
                        if err.is_none() {
                            eprintln!("Token creation confirmed! ({} seconds)", attempts as f32 * 0.1);
                            transaction_confirmed = true;
                            break;
                        } else {
                            eprintln!("Token creation failed with error: {:?}", err);
                            return TokenCreationResult {
                                success: false,
                                signature: Some(signature.to_string()),
                                error_message: Some(format!("Transaction failed: {:?}", err)),
                            };
                        }
                    },
                    Ok(None) => {
                        attempts += 1;
                        std::thread::sleep(std::time::Duration::from_millis(100));
                    },
                    Err(e) => {
                        eprintln!("Failed to check transaction status: {}", e);
                        attempts += 1;
                        std::thread::sleep(std::time::Duration::from_millis(100));
                    }
                }
            }
            
            if transaction_confirmed {
                TokenCreationResult {
                    success: true,
                    signature: Some(signature.to_string()),
                    error_message: None,
                }
            } else {
                TokenCreationResult {
                    success: false,
                    signature: Some(signature.to_string()),
                    error_message: Some("Transaction did not confirm within timeout".to_string()),
                }
            }
        },
        Err(e) => {
            eprintln!("Failed to send transaction: {}", e);
            eprintln!("Error details: {:?}", e);
            TokenCreationResult {
                success: false,
                signature: None,
                error_message: Some(format!("Failed to send transaction: {}", e)),
            }
        }
    }
}

// Create token creation instruction (includes dev buy)
fn create_token_creation_instruction(
    deployer_keypair: &Keypair,
    token_mint_keypair: &Keypair,
    metadata_uri: &str,
    dev_buy_amount: f64,
    token_name: &str,
    token_symbol: &str,
    _token_description: &str,
) -> Result<Vec<Instruction>, Box<dyn std::error::Error>> {
    let mint_pubkey = token_mint_keypair.pubkey();
    let deployer_pubkey = deployer_keypair.pubkey();

    let (bonding_curve, _) = Pubkey::find_program_address(
        &[b"bonding-curve", mint_pubkey.as_ref()],
        &Pubkey::from_str(PUMP_PROGRAM_ID)?
    );

    let (metadata_account, _) = Pubkey::find_program_address(
        &[
            b"metadata",
            Pubkey::from_str(METAPLEX_PROGRAM_ID)?.as_ref(),
            mint_pubkey.as_ref(),
        ],
        &Pubkey::from_str(METAPLEX_PROGRAM_ID)?
    );

    let a_bonding_curve = get_associated_token_address(
        &bonding_curve,
        &mint_pubkey,
    );

    // Create deployer's token account for receiving tokens
    let deployer_token_account = get_associated_token_address(
        &deployer_pubkey,
        &mint_pubkey,
    );



    // Create token data with actual metadata according to IDL
    let mut token_data = Vec::from([0x18, 0x1e, 0xc8, 0x28, 0x05, 0x1c, 0x07, 0x77]);
    
    // Add name (string)
    let name_len = token_name.len() as u32;
    token_data.extend_from_slice(&name_len.to_le_bytes());
    token_data.extend_from_slice(token_name.as_bytes());

    // Add symbol (string)
    let symbol_len = token_symbol.len() as u32;
    token_data.extend_from_slice(&symbol_len.to_le_bytes());
    token_data.extend_from_slice(token_symbol.as_bytes());

    // Add uri (string)
    let uri_len = metadata_uri.len() as u32;
    token_data.extend_from_slice(&uri_len.to_le_bytes());
    token_data.extend_from_slice(metadata_uri.as_bytes());

    // Add creator (pubkey)
    token_data.extend_from_slice(&deployer_pubkey.to_bytes());

    // Create the token creation instruction
    let create_instruction = Instruction::new_with_bytes(
        Pubkey::from_str(PUMP_PROGRAM_ID)?,
        &token_data,
        vec![
            AccountMeta::new(mint_pubkey, true),
            AccountMeta::new_readonly(Pubkey::from_str(MINT_AUTHORITY)?, false),
            AccountMeta::new(bonding_curve, false),
            AccountMeta::new(a_bonding_curve, false),
            AccountMeta::new_readonly(Pubkey::from_str(PUMP_GLOBAL)?, false),
            AccountMeta::new_readonly(Pubkey::from_str(METAPLEX_PROGRAM_ID)?, false),
            AccountMeta::new(metadata_account, false),
            AccountMeta::new(deployer_pubkey, true),
            AccountMeta::new_readonly(system_program::id(), false),
            AccountMeta::new_readonly(spl_token::id(), false),
            AccountMeta::new_readonly(spl_associated_token_account::id(), false),
            AccountMeta::new_readonly(Pubkey::from_str("SysvarRent111111111111111111111111111111111")?, false),
            AccountMeta::new_readonly(Pubkey::from_str(PUMP_EVENT_AUTHORITY)?, false),
            AccountMeta::new_readonly(Pubkey::from_str(PUMP_PROGRAM_ID)?, false),
            
        ]
    );
    // Create ATA instruction for deployer's token account
    // The buy instruction requires the user's ATA to already exist
    let ata_instruction = create_associated_token_account_idempotent(
        &deployer_pubkey,
        &deployer_pubkey,
        &mint_pubkey,
        &spl_token::id(),
    );

    // Create buy instruction for deployer (dev buy)
    // Compensate for 1% Pump.fun fee so user gets exactly what they want
    let fee_compensated_amount = dev_buy_amount / 0.99; // Compensate for 1% fee
    let buy_amount_lamports = (fee_compensated_amount * 1_000_000_000.0) as u64;


    let (tokens_to_receive, _max_sol_cost, _) = get_amount_out(
        buy_amount_lamports,
        30_000_000_000u64,
        1_073_000_000_000_000u64,
    );
    // Use exact amount - no slippage reduction
    let tokens_to_receive_exact = tokens_to_receive;

    
    // Use the correct buy instruction format from pump.rs
    let mut buy_instruction_data = vec![
        0x66, 0x06, 0x3d, 0x12, 0x01, 0xda, 0xeb, 0xea,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ];
    
    // Set the buy amount in lamports (amount to spend) - EXACT AMOUNT
    buy_instruction_data[8..16].copy_from_slice(&tokens_to_receive_exact.to_le_bytes());
    // Set minimum tokens to receive (same as expected for exact amount)
    buy_instruction_data[16..24].copy_from_slice(&tokens_to_receive_exact.to_le_bytes());


    let creator_vault: Pubkey = get_creator_vault_pda(&deployer_pubkey).unwrap();
    eprintln!("Debug: Creator vault: {}", creator_vault);


    let buy_instruction = Instruction {
        program_id: Pubkey::from_str(PUMP_PROGRAM_ID)?,
        accounts: vec![
            AccountMeta::new_readonly(Pubkey::from_str(PUMP_GLOBAL)?, false),
            AccountMeta::new(Pubkey::from_str(FEE_RECIPIENT)?, false), // Static fee recipient
            AccountMeta::new(mint_pubkey, false),
            AccountMeta::new(bonding_curve, false),
            AccountMeta::new(a_bonding_curve, false),
            AccountMeta::new(deployer_token_account, false),
            AccountMeta::new(deployer_pubkey, true),
            AccountMeta::new_readonly(system_program::id(), false),
            AccountMeta::new_readonly(spl_token::id(), false),
            AccountMeta::new(creator_vault, false),
            AccountMeta::new_readonly(Pubkey::from_str(PUMP_EVENT_AUTHORITY)?, false),
            AccountMeta::new_readonly(Pubkey::from_str(PUMP_PROGRAM_ID)?, false),
        ],
        data: buy_instruction_data,
    };

    eprintln!("Debug: Buy instruction accounts: {:?}", buy_instruction.accounts);
    
    let instructions = vec![create_instruction, ata_instruction, buy_instruction];
    
    eprintln!("Debug: Created {} instructions", instructions.len());
    eprintln!("Debug: Deployer pubkey: {}", deployer_pubkey);
    eprintln!("Debug: Mint pubkey: {}", mint_pubkey);
    eprintln!("Debug: Bonding curve: {}", bonding_curve);
    eprintln!("Debug: Deployer token account: {}", deployer_token_account);
    eprintln!("Debug: Buy amount lamports: {}", buy_amount_lamports);
    
    Ok(instructions)
}

// ===== JITO BUNDLE LOGIC =====

#[derive(serde::Deserialize)]
struct JitoConfig {
    uuid: String,
    rpc: JitoRpcConfig,
    commitment: String,
}

#[derive(serde::Deserialize)]
struct JitoRpcConfig {
    mainnet: String,
    wss: String,
}

/// Load Jito configuration from jito.json
fn load_jito_config() -> Result<JitoConfig, Box<dyn std::error::Error>> {
    let config_content = std::fs::read_to_string("config/jito.json")?;
    let config: JitoConfig = serde_json::from_str(&config_content)?;
    Ok(config)
}

/// Distribute sniper wallets into transactions (max 5 wallets per transaction)
fn distribute_wallets_to_transactions(sniper_wallets: &[SniperWallet]) -> Vec<Vec<&SniperWallet>> {
    let mut transactions = Vec::new();
    let mut current_transaction = Vec::new();
    
    for wallet in sniper_wallets {
        if current_transaction.len() >= JITO_MAX_WALLETS_PER_TRANSACTION {
            transactions.push(current_transaction);
            current_transaction = Vec::new();
        }
        current_transaction.push(wallet);
    }
    
    if !current_transaction.is_empty() {
        transactions.push(current_transaction);
    }
    
    transactions
}

/// Build buy transaction for a group of sniper wallets
fn build_sniper_buy_transaction(
    sniper_wallets: &[&SniperWallet],
    token_mint: &Pubkey,
    deployer_pubkey: &Pubkey,
    rpc_client: &RpcClient,
) -> Result<VersionedTransaction, Box<dyn std::error::Error>> {
    let mut instructions = Vec::new();
    
    for sniper_wallet in sniper_wallets {
        // Parse sniper keypair
        let sniper_keypair = match bs58::decode(&sniper_wallet.private_key).into_vec() {
            Ok(bytes) => match Keypair::from_bytes(&bytes) {
                Ok(kp) => kp,
                Err(_) => continue,
            },
            Err(_) => continue,
        };
        
        // Create sniper's token account
        let _sniper_token_account = get_associated_token_address(&sniper_keypair.pubkey(), token_mint);
        let create_ata_ix = create_associated_token_account_idempotent(
            &sniper_keypair.pubkey(),
            &sniper_keypair.pubkey(),
            token_mint,
            &spl_token::id(),
        );
        instructions.push(create_ata_ix);
        
        // Create buy instruction for this sniper
        let buy_ix = create_sniper_buy_instruction(&sniper_keypair, token_mint, sniper_wallet.buy_amount, deployer_pubkey)?;
        instructions.push(buy_ix);
    }
    
    // Get latest blockhash
    let blockhash = rpc_client.get_latest_blockhash()?;
    
    // Create transaction with blockhash
    let mut transaction = Transaction::new_with_payer(
        &instructions,
        Some(&sniper_wallets[0].public_key.parse::<Pubkey>()?),
    );
    transaction.message.recent_blockhash = blockhash;
    
    // Sign with all sniper keypairs
    let mut signers = Vec::new();
    for sniper_wallet in sniper_wallets {
        let sniper_keypair = match bs58::decode(&sniper_wallet.private_key).into_vec() {
            Ok(bytes) => match Keypair::from_bytes(&bytes) {
                Ok(kp) => kp,
                Err(_) => continue,
            },
            Err(_) => continue,
        };
        signers.push(sniper_keypair);
    }
    
    // Convert to VersionedTransaction
    let signer_refs: Vec<&Keypair> = signers.iter().collect();
    let versioned_transaction = VersionedTransaction::try_new(
        solana_sdk::message::VersionedMessage::Legacy(transaction.message),
        &signer_refs,
    )?;
    
    Ok(versioned_transaction)
}

/// Create buy instruction for a single sniper wallet
fn create_sniper_buy_instruction(
    sniper_keypair: &Keypair,
    token_mint: &Pubkey,
    buy_amount: f64,
    deployer_pubkey: &Pubkey,
) -> Result<Instruction, Box<dyn std::error::Error>> {
    let (bonding_curve, _) = Pubkey::find_program_address(
        &[b"bonding-curve", token_mint.as_ref()],
        &Pubkey::from_str(PUMP_PROGRAM_ID)?
    );
    
    let a_bonding_curve = get_associated_token_address(&bonding_curve, token_mint);
    let sniper_token_account = get_associated_token_address(&sniper_keypair.pubkey(), token_mint);
    
    // Use the provided deployer's public key to derive the creator vault
    let creator_vault = get_creator_vault_pda(deployer_pubkey).unwrap();
    
    // Calculate buy amount with fee compensation
    let fee_compensated_amount = buy_amount / 0.99; // Compensate for 1% fee
    let buy_amount_lamports = (fee_compensated_amount * 1_000_000_000.0) as u64;
    
    let (tokens_to_receive, _, _) = get_amount_out(
        buy_amount_lamports,
        30_000_000_000u64,
        1_073_000_000_000_000u64,
    );
    
    // Create buy instruction data
    let mut buy_instruction_data = vec![
        0x66, 0x06, 0x3d, 0x12, 0x01, 0xda, 0xeb, 0xea,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ];
    
    buy_instruction_data[8..16].copy_from_slice(&tokens_to_receive.to_le_bytes());
    buy_instruction_data[16..24].copy_from_slice(&tokens_to_receive.to_le_bytes());
    
    let buy_instruction = Instruction {
        program_id: Pubkey::from_str(PUMP_PROGRAM_ID)?,
        accounts: vec![
            AccountMeta::new_readonly(Pubkey::from_str(PUMP_GLOBAL)?, false),
            AccountMeta::new(Pubkey::from_str(FEE_RECIPIENT)?, false),
            AccountMeta::new(*token_mint, false),
            AccountMeta::new(bonding_curve, false),
            AccountMeta::new(a_bonding_curve, false),
            AccountMeta::new(sniper_token_account, false),
            AccountMeta::new(sniper_keypair.pubkey(), true),
            AccountMeta::new_readonly(system_program::id(), false),
            AccountMeta::new_readonly(spl_token::id(), false),
            AccountMeta::new(creator_vault, false),
            AccountMeta::new_readonly(Pubkey::from_str(PUMP_EVENT_AUTHORITY)?, false),
            AccountMeta::new_readonly(Pubkey::from_str(PUMP_PROGRAM_ID)?, false),
        ],
        data: buy_instruction_data,
    };
    
    Ok(buy_instruction)
}

/// Create and send Jito bundle
async fn send_jito_bundle(
    transactions: Vec<VersionedTransaction>,
    jito_config: &JitoConfig,
) -> Result<String, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let url = format!("{}{}", JITO_BLOCK_ENGINE_URL, JITO_BUNDLE_ENDPOINT);
    
    // Convert transactions to base64
    let mut base64_transactions = Vec::new();
    for tx in transactions {
        let serialized = bincode::serialize(&tx)?;
        let base64_tx = STANDARD.encode(&serialized);
        base64_transactions.push(base64_tx);
    }
    
    // Create Jito bundle request
    let request_body = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "sendBundle",
        "params": [
            base64_transactions,
            {
                "encoding": "base64"
            }
        ]
    });
    
    eprintln!("Sending Jito bundle request to: {}", url);
    eprintln!("Number of transactions: {}", base64_transactions.len());
    
    // Send bundle to Jito
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .header("x-jito-auth", &jito_config.uuid)
        .json(&request_body)
        .send()
        .await?;
    
    let response_text = response.text().await?;
    eprintln!("Jito response: {}", response_text);
    
    let response_json: Value = serde_json::from_str(&response_text)?;
    
    if let Some(result) = response_json.get("result") {
        if let Some(bundle_id) = result.as_str() {
            eprintln!("Jito bundle sent successfully! Bundle ID: {}", bundle_id);
            return Ok(bundle_id.to_string());
        }
    }
    
    // Check for error in response
    if let Some(error) = response_json.get("error") {
        eprintln!("Jito bundle error: {:?}", error);
        return Err(format!("Jito bundle error: {:?}", error).into());
    }
    
    Err(format!("Failed to send Jito bundle: {}", response_text).into())
}

/// Send single transaction to Jito (for 1-5 wallets)
async fn send_jito_single_transaction(
    transaction: VersionedTransaction,
    jito_config: &JitoConfig,
) -> Result<String, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let url = format!("{}/api/v1/bundles", JITO_BLOCK_ENGINE_URL);
    
    // Convert transaction to base64
    let serialized = bincode::serialize(&transaction)?;
    let base64_tx = STANDARD.encode(&serialized);
    
    // Create Jito bundle request (even for single transaction)
    let request_body = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "sendBundle",
        "params": [
            [base64_tx],
            {
                "encoding": "base64"
            }
        ]
    });
    
    eprintln!("Sending Jito single transaction to: {}", url);
    
    // Send transaction to Jito
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .header("x-jito-auth", &jito_config.uuid)
        .json(&request_body)
        .send()
        .await?;
    
    let response_text = response.text().await?;
    eprintln!("Jito single transaction response: {}", response_text);
    
    let response_json: Value = serde_json::from_str(&response_text)?;
    
    if let Some(result) = response_json.get("result") {
        if let Some(bundle_id) = result.as_str() {
            eprintln!("Jito bundle sent successfully! Bundle ID: {}", bundle_id);
            return Ok(bundle_id.to_string());
        }
    }
    
    // Check for error in response
    if let Some(error) = response_json.get("error") {
        eprintln!("Jito single transaction error: {:?}", error);
        return Err(format!("Jito single transaction error: {:?}", error).into());
    }
    
    Err(format!("Failed to send Jito single transaction: {}", response_text).into())
}

/// Poll for transaction confirmation using Helius RPC
async fn poll_transaction_confirmation(
    signature: &str,
) -> Result<bool, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let url = HELIUS_RPC_URL;
    
    for attempt in 0..30 { // Check for 3 seconds (30 * 100ms)
        let request_body = json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getSignatureStatuses",
            "params": [
                [signature],
                {
                    "searchTransactionHistory": true
                }
            ]
        });
        
        let response = client
            .post(url)
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await?;
        
        let response_text = response.text().await?;
        let response_json: Value = serde_json::from_str(&response_text)?;
        
        if let Some(result) = response_json.get("result") {
            if let Some(value) = result.get("value") {
                if let Some(statuses) = value.as_array() {
                    if let Some(status) = statuses.get(0) {
                        if let Some(confirmation_status) = status.get("confirmationStatus") {
                            if confirmation_status.as_str() == Some("confirmed") || confirmation_status.as_str() == Some("finalized") {
                                eprintln!("Transaction confirmed on-chain! (attempt {})", attempt + 1);
                                return Ok(true);
                            }
                        }
                        if let Some(err) = status.get("err") {
                            if !err.is_null() {
                                eprintln!("Transaction failed with error: {:?}", err);
                                return Ok(false);
                            }
                        }
                    }
                }
            }
        }
        
        // Wait before next poll
        sleep(Duration::from_millis(100)).await;
    }
    
    eprintln!("Transaction confirmation timeout");
    Ok(false)
}

/// Poll for token mint confirmation using Helius RPC
async fn poll_token_confirmation(
    token_mint: &Pubkey,
    max_attempts: u32,
) -> Result<bool, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let url = HELIUS_RPC_URL;
    
    for attempt in 0..max_attempts {
        let request_body = json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getAccountInfo",
            "params": [
                token_mint.to_string(),
                {
                    "encoding": "base64",
                    "commitment": "confirmed"
                }
            ]
        });
        
        let response = client
            .post(url)
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await?;
        
        let response_text = response.text().await?;
        let response_json: Value = serde_json::from_str(&response_text)?;
        
        if let Some(result) = response_json.get("result") {
            if let Some(value) = result.get("value") {
                if !value.is_null() {
                    eprintln!("Token mint confirmed on-chain! (attempt {})", attempt + 1);
                    return Ok(true);
                }
            }
        }
        
        // Wait before next poll
        sleep(Duration::from_millis(JITO_POLL_INTERVAL_MS)).await;
    }
    
    Err("Token mint confirmation timeout".into())
}

/// Main function to send Jito bundle after token creation
pub async fn send_jito_bundle_after_token_creation(
    token_mint: &Pubkey,
    sniper_wallets: &[SniperWallet],
    deployer_pubkey: &Pubkey,
) -> Result<String, Box<dyn std::error::Error>> {
    eprintln!("🚀 Starting Jito bundle process...");
    eprintln!("Token mint: {}", token_mint);
    eprintln!("Number of sniper wallets: {}", sniper_wallets.len());
    
    // Load Jito configuration
    let jito_config = load_jito_config()?;
    eprintln!("Loaded Jito config with UUID: {}", jito_config.uuid);
    
    // Poll for token confirmation
    eprintln!("Polling for token mint confirmation...");
    poll_token_confirmation(token_mint, JITO_MAX_POLL_ATTEMPTS).await?;
    
    // Build transactions for each group
    let rpc_client = RpcClient::new(HELIUS_RPC_URL.to_string());
    
    if sniper_wallets.len() <= 5 {
        // Use single transaction for 1-5 wallets
        eprintln!("Using single Jito transaction for {} wallets", sniper_wallets.len());
        
        let wallet_refs: Vec<&SniperWallet> = sniper_wallets.iter().collect();
        let tx = build_sniper_buy_transaction(&wallet_refs, token_mint, deployer_pubkey, &rpc_client)?;
        
        // Send single transaction to Jito
        eprintln!("Sending single transaction to Jito...");
        eprintln!("Transaction details:");
        eprintln!("  Instructions: {}", tx.message.instructions().len());
        eprintln!("  Signatures: {}", tx.signatures.len());
        
        let signature = send_jito_single_transaction(tx, &jito_config).await?;
        
        eprintln!("✅ Jito single transaction sent successfully!");
        eprintln!("Signature: {}", signature);
        
        Ok(signature)
    } else {
        // Use bundle for 6+ wallets
        eprintln!("Using Jito bundle for {} wallets", sniper_wallets.len());
        
        // Distribute wallets into transactions
        let wallet_groups = distribute_wallets_to_transactions(sniper_wallets);
        eprintln!("Distributed {} wallets into {} transactions", sniper_wallets.len(), wallet_groups.len());
        
        let mut transactions = Vec::new();
        
        for (i, wallet_group) in wallet_groups.iter().enumerate() {
            eprintln!("Building transaction {} with {} wallets", i + 1, wallet_group.len());
            
            let tx = build_sniper_buy_transaction(wallet_group, token_mint, deployer_pubkey, &rpc_client)?;
            
            transactions.push(tx);
        }
        
        // Send bundle to Jito
        eprintln!("Sending {} transactions as Jito bundle...", transactions.len());
        let bundle_id = send_jito_bundle(transactions, &jito_config).await?;
        
        eprintln!("✅ Jito bundle sent successfully!");
        eprintln!("Bundle ID: {}", bundle_id);
        
        Ok(bundle_id)
    }
}

/// CLI command for testing Jito bundles
fn test_jito_bundle_cli(token_mint: &str, sniper_wallets_json: &str, deployer_pubkey: &str) -> Result<String, Box<dyn std::error::Error>> {
    let token_mint_pubkey = token_mint.parse::<Pubkey>()?;
    let sniper_wallets: Vec<SniperWallet> = serde_json::from_str(sniper_wallets_json)?;
    let deployer_pubkey = deployer_pubkey.parse::<Pubkey>()?;
    
    // Run async function in sync context
    let rt = tokio::runtime::Runtime::new()?;
    rt.block_on(send_jito_bundle_after_token_creation(&token_mint_pubkey, &sniper_wallets, &deployer_pubkey))
}

 