use solana_sdk::{
    signature::{Keypair, Signer},
    pubkey::Pubkey,
};
use solana_client::rpc_client::RpcClient;
use bs58;
use std::env;
use std::str::FromStr;

#[derive(serde::Serialize)]
struct WalletResult {
    public_key: String,
    secret_key: String,
    success: bool,
    error_message: Option<String>,
}

#[derive(serde::Serialize)]
struct BalanceResult {
    balance: u64,
    success: bool,
    error_message: Option<String>,
}

fn main() {
    let args: Vec<String> = env::args().collect();
    
    if args.len() < 2 {
        eprintln!("Usage: {} <command> [arg]", args[0]);
        std::process::exit(1);
    }
    
    let command = &args[1];
    let result = match command.as_str() {
        "generate" => {
            let wallet_result = generate_solana_wallet();
            serde_json::to_string(&wallet_result).unwrap()
        },
        "derive" => {
            if args.len() < 3 {
                eprintln!("Usage: {} derive <private_key>", args[0]);
                std::process::exit(1);
            }
            let wallet_result = derive_public_key_from_private_key(&args[2]);
            serde_json::to_string(&wallet_result).unwrap()
        },
        "balance" => {
            if args.len() < 3 {
                eprintln!("Usage: {} balance <public_key>", args[0]);
                std::process::exit(1);
            }
            let balance_result = check_solana_balance(&args[2]);
            serde_json::to_string(&balance_result).unwrap()
        },
        _ => {
            eprintln!("Unknown command: {}", command);
            std::process::exit(1);
        }
    };
    
    // Output result as JSON
    println!("{}", result);
}

fn generate_solana_wallet() -> WalletResult {
    let keypair = Keypair::new();
    let public_key = keypair.pubkey();
    let secret_key = keypair.to_bytes();
    
    WalletResult {
        public_key: public_key.to_string(),
        secret_key: bs58::encode(&secret_key).into_string(),
        success: true,
        error_message: None,
    }
}

fn derive_public_key_from_private_key(private_key_base58: &str) -> WalletResult {
    match bs58::decode(private_key_base58).into_vec() {
        Ok(secret_key_bytes) => {
            if secret_key_bytes.len() != 64 {
                return WalletResult {
                    public_key: String::new(),
                    secret_key: String::new(),
                    success: false,
                    error_message: Some("Invalid private key length".to_string()),
                };
            }
            
            match Keypair::from_bytes(&secret_key_bytes) {
                Ok(keypair) => {
                    let public_key = keypair.pubkey();
                    WalletResult {
                        public_key: public_key.to_string(),
                        secret_key: String::new(),
                        success: true,
                        error_message: None,
                    }
                }
                Err(_) => WalletResult {
                    public_key: String::new(),
                    secret_key: String::new(),
                    success: false,
                    error_message: Some("Invalid private key format".to_string()),
                }
            }
        }
        Err(_) => WalletResult {
            public_key: String::new(),
            secret_key: String::new(),
            success: false,
            error_message: Some("Failed to decode private key".to_string()),
        }
    }
}

fn check_solana_balance(public_key: &str) -> BalanceResult {
    // Parse the public key
    let pubkey = match Pubkey::from_str(public_key) {
        Ok(pk) => pk,
        Err(_) => return BalanceResult {
            balance: 0,
            success: false,
            error_message: Some("Invalid public key format".to_string()),
        }
    };
    
    // Connect to Solana RPC (using a public endpoint)
    let rpc_url = "https://api.mainnet-beta.solana.com";
    let client = RpcClient::new(rpc_url.to_string());
    
    // Get the balance
    match client.get_balance(&pubkey) {
        Ok(balance) => BalanceResult {
            balance,
            success: true,
            error_message: None,
        },
        Err(e) => BalanceResult {
            balance: 0,
            success: false,
            error_message: Some(format!("RPC error: {}", e)),
        }
    }
} 