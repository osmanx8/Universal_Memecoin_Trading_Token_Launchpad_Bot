import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Paper
} from '@mui/material';
import { ContentCopy as CopyIcon, Add as AddIcon, CloudUpload as UploadIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useTokens } from '../components/TokenContext';
import StandardDialog from '../components/StandardDialog';
import LoadingDialog from '../components/LoadingDialog';
import TokenImage from '../components/TokenImage';
import axios from 'axios';

const UnifiedButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #e0e0e0 0%, #c0c0c0 50%, #e0e0e0 100%)',
  color: '#333333',
  fontWeight: 600,
  fontSize: 18,
  borderRadius: 8,
  border: '1px solid rgba(255, 255, 255, 0.3)',
  outline: 'none !important',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1) !important',
  transition: 'all 0.2s',
  '&:hover, &:focus, &:active': {
    background: 'linear-gradient(135deg, #d0d0d0 0%, #b0b0b0 50%, #d0d0d0 100%)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    outline: 'none !important',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15) !important',
  },
}));

function generateRandomId(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

const PrepareMintPump = () => {
  const [deployerWallet, setDeployerWallet] = useState('');
  const [buyerWallet, setBuyerWallet] = useState('');
  const [deployerWalletPrivateKey, setDeployerWalletPrivateKey] = useState('');
  const [buyerWalletPrivateKey, setBuyerWalletPrivateKey] = useState('');
  const [deployerWalletPublicKey, setDeployerWalletPublicKey] = useState('');
  const [buyerWalletPublicKey, setBuyerWalletPublicKey] = useState('');
  const [deployerBalance, setDeployerBalance] = useState('0.00');
  const [buyerBalance, setBuyerBalance] = useState('0.00');
  const [showMinted, setShowMinted] = useState(false);
  const [metadata, setMetadata] = useState({
    name: '',
    symbol: '',
    logo: '',
    mintKey: '',
    description: '',
    website: '',
    twitter: '',
    telegram: ''
  });
  // Modal for generated key
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [generatedPrivateKey, setGeneratedPrivateKey] = useState('');
  const [generatedPublicAddress, setGeneratedPublicAddress] = useState('');
  const [lastGeneratedType, setLastGeneratedType] = useState('');
  const { addToken, activeToken, setTokenMinted } = useTokens();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [walletError, setWalletError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [metadataUri, setMetadataUri] = useState('');
  const [pumpca, setPumpca] = useState('');
  // Add state for wallet count, total buy, per-wallet fund
  const [numWallets, setNumWallets] = useState(1);
  const [totalBuy, setTotalBuy] = useState('');

  // Calculate extra fund and total fund using the old formula
  const extraFund = 1.78 * Math.pow(numWallets / 16, 0.6);
  const totalFund = (Number(totalBuy) || 0) + extraFund;
  const totalFundFixed = totalFund ? totalFund.toFixed(4) : '';
  const perWalletBuy = numWallets > 0 ? (Number(totalBuy) || 0) / numWallets : 0;
  const perWalletBuyFixed = perWalletBuy ? perWalletBuy.toFixed(4) : '';
  const maxTotalFund = 84;

  // Cleanup effect to clear wallet data when component unmounts
  useEffect(() => {
    return () => {
      // Clear wallet data when component unmounts
      setDeployerWallet('');
      setBuyerWallet('');
      setDeployerWalletPrivateKey('');
      setBuyerWalletPrivateKey('');
      setDeployerWalletPublicKey('');
      setBuyerWalletPublicKey('');
      setDeployerBalance('0.00');
      setBuyerBalance('0.00');
    };
  }, []);

  // Helper to fetch SOL balance
  const fetchSolBalance = async (publicKey) => {
    if (!publicKey) return '0.00'; // Prevent 400 error if publicKey is missing
    try {
      const response = await axios.post('http://localhost:5000/api/wallets/balance', { publicKey });
      return response.data.balance.toFixed(4);
    } catch (err) {
      return '0.00';
    }
  };

  // Generate real Solana wallet via backend
  const handleGenerateWallet = async (type) => {
    setWalletError('');
    setIsLoading(true);
    setLoadingMessage('Generating wallet...');
    try {
      const authKey = localStorage.getItem('authKey');
      if (!authKey) {
        setWalletError('No auth key found. Please log in again.');
        setIsLoading(false);
        return;
      }
      const response = await axios.post('http://localhost:5000/api/wallets/generate', {
        type,
        authKey
      });
      const { publicKey, secretKey } = response.data;
      setGeneratedPrivateKey(secretKey || '');
      setGeneratedPublicAddress(publicKey || '');
      console.log('Set keys:', { secretKey, publicKey });
      setShowKeyModal(true);
      setLastGeneratedType(type);
      if (type === 'deployer') {
        setDeployerWalletPrivateKey(secretKey || '');
        setDeployerWalletPublicKey(publicKey || '');
        const balance = await fetchSolBalance(publicKey);
        setDeployerBalance(balance);
      }
      if (type === 'buyer') {
        setBuyerWalletPrivateKey(secretKey || '');
        setBuyerWalletPublicKey(publicKey || '');
        const balance = await fetchSolBalance(publicKey);
        setBuyerBalance(balance);
      }
    } catch (err) {
      setWalletError(err.response?.data?.message || 'Failed to generate wallet');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleChange = (e) => {
    setMetadata({ ...metadata, [e.target.name]: e.target.value });
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  // Function to generate vanity mint key
  const handleGenerateMintKey = async () => {
    setIsLoading(true);
    setLoadingMessage('Generating vanity mint key...');
    try {
      const response = await axios.get('http://localhost:5000/api/launch/next-vanity-mint-key');
      if (response.data.success) {
        const { publicKey, secretKey } = response.data.data;
        setMetadata(prev => ({ 
          ...prev, 
          mintKey: publicKey,
          mintKeyPrivate: secretKey 
        }));
        console.log(`✅ Generated vanity mint key: ${publicKey}`);
        console.log(`Private key: ${secretKey}`);
      } else {
        throw new Error(response.data.error || 'Failed to generate mint key');
      }
    } catch (error) {
      console.error('Error generating mint key:', error);
      alert('Failed to generate mint key: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Upload metadata and image to backend (pump.fun IPFS) on Prepare Mint
  const handlePrepareMint = async () => {
    console.log('imageFile:', imageFile); // Debug log
    if (!metadata.name || !metadata.symbol) {
      alert('Name and Symbol are required.');
      return;
    }
    if (!imageFile) {
      alert('Please select an image file.');
      return;
    }
    if (!deployerWalletPrivateKey) {
      alert('Deployer wallet private key is required. Please generate or paste a deployer wallet.');
      return;
    }
    if (!buyerWalletPrivateKey) {
      alert('Buyer wallet private key is required. Please generate or paste a buyer wallet.');
      return;
    }
    if (!metadata.mintKeyPrivate) {
      alert('Token mint key private key is required. Please generate or paste a token mint key.');
      return;
    }
    setIsLoading(true);
    setLoadingMessage('Uploading metadata to IPFS...');
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('name', metadata.name);
      formData.append('symbol', metadata.symbol);
      formData.append('description', metadata.description);
      formData.append('twitter', metadata.twitter);
      formData.append('telegram', metadata.telegram);
      formData.append('website', metadata.website);
      formData.append('authKey', localStorage.getItem('authKey'));

      const response = await axios.post('http://localhost:5000/api/metadata/prepare-mint', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMetadataUri(response.data.metadataUrl);
      setPumpca(response.data.pumpca);
      setShowMinted(true);
      
      // Confirm vanity usage if this was a generated vanity key
      if (metadata.mintKey && metadata.mintKeyPrivate) {
        try {
          await axios.post('http://localhost:5000/api/launch/confirm-vanity-usage', {
            publicKey: metadata.mintKey
          });
          console.log('Vanity key confirmed and removed from pool');
        } catch (error) {
          console.error('Failed to confirm vanity usage:', error);
        }
      }
      
      // Add token to context and backend using real IPFS URLs
      const tokenData = {
        name: metadata.name,
        symbol: metadata.symbol,
        description: metadata.description,
        imageUrl: response.data.imageUrl, // Use the actual IPFS image URL
        tokenMintKey: metadata.mintKey,
        tokenMintKeyPrivate: metadata.mintKeyPrivate, // Store private key for backend
        metadataUri: response.data.metadataUrl, // Use the actual IPFS metadata URL
        deployerPublicKey: deployerWalletPublicKey,
        deployerPrivateKey: deployerWalletPrivateKey,
        buyerPublicKey: buyerWalletPublicKey,
        buyerPrivateKey: buyerWalletPrivateKey
      };
      
      console.log('Saving token with data:', {
        name: tokenData.name,
        symbol: tokenData.symbol,
        tokenMintKey: tokenData.tokenMintKey,
        tokenMintKeyPrivate: tokenData.tokenMintKeyPrivate ? '***' + tokenData.tokenMintKeyPrivate.slice(-8) : 'N/A',
        deployerPublicKey: tokenData.deployerPublicKey,
        deployerPrivateKey: tokenData.deployerPrivateKey ? '***' + tokenData.deployerPrivateKey.slice(-8) : 'N/A',
        buyerPublicKey: tokenData.buyerPublicKey,
        buyerPrivateKey: tokenData.buyerPrivateKey ? '***' + tokenData.buyerPrivateKey.slice(-8) : 'N/A',
        metadataUri: tokenData.metadataUri
      });
      
      addToken(tokenData, imageFile);
    } catch (err) {
      alert('Failed to upload metadata: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleMint = async () => {
    if (!activeToken) {
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Preparing token mint...');

    try {
      // Simulate the actual minting process
      await new Promise(resolve => setTimeout(resolve, 2000)); // This would be your actual minting logic
      setTokenMinted(activeToken.id);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to derive public key from private key using backend
  const derivePublicKeyFromPrivateKey = async (privateKey) => {
    try {
      if (!privateKey || privateKey.length < 40) return '';
      const response = await axios.post('http://localhost:5000/api/wallets/derive-public-key', {
        privateKey: privateKey
      });
      if (response.data.success) {
        return response.data.publicKey;
      }
      return '';
    } catch (error) {
      console.error('Error deriving public key:', error);
      return '';
    }
  };

  return (
    <Box
      className="hide-scrollbar"
      sx={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        pt: 6,
        background: `
          radial-gradient(ellipse at top, rgba(192, 192, 192, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%),
          linear-gradient(90deg, rgba(192, 192, 192, 0.05) 1px, transparent 1px),
          linear-gradient(0deg, rgba(192, 192, 192, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 30px 30px, 30px 30px',
        position: 'relative',
        overflowY: 'auto',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 10% 10%, rgba(192, 192, 192, 0.15) 0%, transparent 40%),
            radial-gradient(circle at 90% 90%, rgba(192, 192, 192, 0.15) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(192, 192, 192, 0.1) 0%, transparent 60%)
          `,
          pointerEvents: 'none'
        }
      }}
    >
      {/* Hide scrollbar for Chrome, Safari, Opera, and Firefox */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <Typography variant="subtitle1" sx={{ color: '#C0C0C0', fontWeight: 600, fontSize: 22, mb: 2, ml: { xs: 2, md: 8 } }}>
        Prepare Mint - PUMP
      </Typography>
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', mt: 2 }}>
        <Paper elevation={3} sx={{ 
          width: '100%', 
          maxWidth: 1000, 
          p: 6, 
          borderRadius: 6, 
          background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)',
          border: '1px solid rgba(192, 192, 192, 0.15)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          ml: -14 
        }}>
          <Paper elevation={3} sx={{ 
            width: '100%', 
            p: 4, 
            borderRadius: 4, 
            background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)',
            border: '1px solid rgba(192, 192, 192, 0.15)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            mb: 4 
          }}>
            {/* Deployer Wallet */}
            <Box sx={{ width: '100%', mb: 3 }}>
              <Typography sx={{ color: 'white', mb: 1 }}>Deployer Wallet</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Paste or generate private key"
                  value={deployerWalletPrivateKey || ''}
                  onChange={async e => {
                    const privateKey = e.target.value || '';
                    setDeployerWalletPrivateKey(privateKey);
                    
                    // Derive public key from private key
                    const publicKey = await derivePublicKeyFromPrivateKey(privateKey);
                    setDeployerWalletPublicKey(publicKey);
                    
                    // Update balance if we have a valid public key
                    if (publicKey) {
                      fetchSolBalance(publicKey).then(balance => setDeployerBalance(balance));
                    } else {
                      setDeployerBalance('0.00');
                    }
                  }}
                  InputProps={{
                    endAdornment: deployerWalletPrivateKey && (
                      <InputAdornment position="end">
                        <IconButton onClick={() => handleCopy(deployerWalletPrivateKey)} size="small">
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    input: { color: 'white' },
                    background: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(192, 192, 192, 0.2)',
                    borderRadius: 2
                  }}
                  autoComplete="off"
                />
                <UnifiedButton onClick={() => handleGenerateWallet('deployer')} sx={{ minWidth: 120 }}>
                  Generate
                </UnifiedButton>
              </Box>
              {deployerWalletPublicKey && (
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, mt: 0.5 }}>
                  Public Address: {deployerWalletPublicKey}
                </Typography>
              )}
              {deployerWalletPublicKey && (
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                  Balance: {deployerBalance} SOL
                </Typography>
              )}
            </Box>
            {/* Buyer Wallet */}
            <Box sx={{ width: '100%', mb: 3 }}>
              <Typography sx={{ color: 'white', mb: 1 }}>Buyer Wallet</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Paste or generate private key"
                  value={buyerWalletPrivateKey || ''}
                  onChange={async e => {
                    const privateKey = e.target.value || '';
                    setBuyerWalletPrivateKey(privateKey);
                    
                    // Derive public key from private key
                    const publicKey = await derivePublicKeyFromPrivateKey(privateKey);
                    setBuyerWalletPublicKey(publicKey);
                    
                    // Update balance if we have a valid public key
                    if (publicKey) {
                      fetchSolBalance(publicKey).then(balance => setBuyerBalance(balance));
                    } else {
                      setBuyerBalance('0.00');
                    }
                  }}
                  InputProps={{
                    endAdornment: buyerWalletPrivateKey && (
                      <InputAdornment position="end">
                        <IconButton onClick={() => handleCopy(buyerWalletPrivateKey)} size="small">
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    input: { color: 'white' },
                    background: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(192, 192, 192, 0.2)',
                    borderRadius: 2
                  }}
                  autoComplete="off"
                />
                <UnifiedButton onClick={() => handleGenerateWallet('buyer')} sx={{ minWidth: 120 }}>
                  Generate
                </UnifiedButton>
              </Box>
              {buyerWalletPublicKey && (
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, mt: 0.5 }}>
                  Public Address: {buyerWalletPublicKey}
                </Typography>
              )}
              {buyerWalletPublicKey && (
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                  Balance: {buyerBalance} SOL
                </Typography>
              )}
            </Box>
            {/* Token Info */}
            <Box sx={{ width: '100%', mb: 3 }}>
              <Typography sx={{ color: 'white', mb: 1 }}>Token Info</Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="logo-upload"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // For preview
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setMetadata(m => ({ ...m, logo: reader.result }));
                        };
                        reader.readAsDataURL(file);

                        // For backend upload
                        setImageFile(file);
                        // Debug log
                        console.log('Image file set:', file);
                      }
                    }}
                  />
                  <label htmlFor="logo-upload">
                    <Box
                      sx={{
                        width: 100,
                        height: 100,
                        border: '2px dashed rgba(192, 192, 192, 0.3)',
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        background: 'rgba(0, 0, 0, 0.4)',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: '#C0C0C0',
                          background: 'rgba(192, 192, 192, 0.1)'
                        }
                      }}
                    >
                      {metadata.logo ? (
                        <img 
                          src={metadata.logo} 
                          alt="token logo" 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            borderRadius: 8
                          }} 
                        />
                      ) : (
                        <>
                          <UploadIcon sx={{ color: '#C0C0C0', fontSize: 32, mb: 1 }} />
                          <Typography sx={{ color: '#C0C0C0', fontSize: 12, textAlign: 'center' }}>
                            Upload Logo
                          </Typography>
                        </>
                      )}
                    </Box>
                  </label>
                </Box>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <TextField
                    fullWidth
                    name="name"
                    placeholder="Enter Token Name"
                    value={metadata.name}
                    onChange={handleChange}
                    sx={{ input: { color: 'white' }, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(192, 192, 192, 0.2)', borderRadius: 2 }}
                    autoComplete="off"
                  />
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                      fullWidth
                      name="symbol"
                      placeholder="Enter Token Symbol"
                      value={metadata.symbol}
                      onChange={handleChange}
                      sx={{ input: { color: 'white' }, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(192, 192, 192, 0.2)', borderRadius: 2 }}
                      autoComplete="off"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                      fullWidth
                      name="mintKeyPrivate"
                      placeholder="Token Mint Key Private Key (paste or generate)"
                      value={metadata.mintKeyPrivate || ''}
                      onChange={async e => {
                        const privateKey = e.target.value || '';
                        setMetadata(prev => ({ ...prev, mintKeyPrivate: privateKey }));
                        
                        // Derive public key from private key
                        if (privateKey && privateKey.length > 40) {
                          const publicKey = await derivePublicKeyFromPrivateKey(privateKey);
                          setMetadata(prev => ({ ...prev, mintKey: publicKey }));
                        } else {
                          setMetadata(prev => ({ ...prev, mintKey: '' }));
                        }
                      }}
                      InputProps={{
                        endAdornment: metadata.mintKeyPrivate && (
                          <InputAdornment position="end">
                            <IconButton onClick={() => handleCopy(metadata.mintKeyPrivate)} size="small">
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                      sx={{ input: { color: 'white' }, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(192, 192, 192, 0.2)', borderRadius: 2, flex: 1 }}
                      autoComplete="off"
                    />
                    <UnifiedButton 
                      onClick={handleGenerateMintKey}
                      disabled={isLoading}
                      sx={{ 
                        color: 'black', 
                        background: 'linear-gradient(135deg, #e0e0e0 0%, #c0c0c0 50%, #e0e0e0 100%)',
                        '&:disabled': {
                          background: 'linear-gradient(135deg, #808080 0%, #606060 50%, #808080 100%)',
                          color: '#666'
                        }
                      }}
                    >
                      {isLoading ? 'Generating...' : 'Generate'}
                    </UnifiedButton>
                  </Box>
                  {metadata.mintKey && (
                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, mt: 0.5 }}>
                      Public Address: {metadata.mintKey}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
            {/* Additional Info */}
            <Box sx={{ width: '100%', mb: 3 }}>
              <Typography sx={{ color: 'white', mb: 1 }}>Additional Info <span style={{ color: '#aaa', fontSize: 12 }}>(optional)</span></Typography>
              <TextField
                fullWidth
                name="description"
                placeholder="Enter Token Description"
                value={metadata.description}
                onChange={handleChange}
                multiline
                minRows={2}
                sx={{ input: { color: 'white' }, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(192, 192, 192, 0.2)', borderRadius: 2, mb: 1 }}
                autoComplete="off"
              />
              <TextField
                fullWidth
                name="website"
                placeholder="Website Link"
                value={metadata.website}
                onChange={handleChange}
                sx={{ input: { color: 'white' }, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(192, 192, 192, 0.2)', borderRadius: 2, mb: 1 }}
                autoComplete="off"
              />
              <TextField
                fullWidth
                name="twitter"
                placeholder="Twitter Link"
                value={metadata.twitter}
                onChange={handleChange}
                sx={{ input: { color: 'white' }, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(192, 192, 192, 0.2)', borderRadius: 2, mb: 1 }}
                autoComplete="off"
              />
              <TextField
                fullWidth
                name="telegram"
                placeholder="Telegram Link"
                value={metadata.telegram}
                onChange={handleChange}
                sx={{ 
                  input: { color: 'white' }, 
                  background: 'rgba(0, 0, 0, 0.8)', 
                  backdropFilter: 'blur(10px)', 
                  border: '1px solid rgba(192, 192, 192, 0.2)', 
                  borderRadius: 2 
                }}
                autoComplete="off"
              />
            </Box>
            <UnifiedButton
              fullWidth
              size="large"
              sx={{ mt: 2, fontWeight: 600, fontSize: 18, borderRadius: 2, py: 1.5 }}
              onClick={handlePrepareMint}
            >
              Prepare Mint
            </UnifiedButton>
          </Paper>
        </Paper>
      </Box>
      <StandardDialog
        open={showMinted}
        onClose={() => setShowMinted(false)}
        title="Token Successfully Minted"
        actions={
          <UnifiedButton onClick={() => setShowMinted(false)} color="primary" variant="contained">
            Close
          </UnifiedButton>
        }
      >
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Your token has been minted successfully!
        </Typography>
        {metadataUri && (
          <Typography sx={{ mt: 2 }}>
            Metadata URI:{' '}
            <a
              href={metadataUri}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#7c3aed', wordBreak: 'break-all' }}
            >
              {metadataUri}
            </a>
          </Typography>
        )}
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', mt: 2 }}>
          Token Mint Key Public: {metadata.mintKey || 'N/A'}
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>
          Token Mint Key Private: {metadata.mintKeyPrivate ? '***' + metadata.mintKeyPrivate.slice(-8) : 'N/A'}
        </Typography>
      </StandardDialog>
      <StandardDialog
        open={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        title="Generated Keypair"
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <UnifiedButton onClick={() => {
              if (lastGeneratedType === 'deployer') {
                setDeployerWalletPrivateKey(generatedPrivateKey);
                setDeployerWalletPublicKey(generatedPublicAddress);
              } else if (lastGeneratedType === 'buyer') {
                setBuyerWalletPrivateKey(generatedPrivateKey);
                setBuyerWalletPublicKey(generatedPublicAddress);
              }
              setShowKeyModal(false);
            }} color="primary" variant="contained">
              Use This Wallet
            </UnifiedButton>
            <UnifiedButton onClick={() => setShowKeyModal(false)} color="primary" variant="contained">
              Close
            </UnifiedButton>
          </Box>
        }
      >
        {console.log('Modal render:', { generatedPrivateKey, generatedPublicAddress })}
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ color: 'white', fontWeight: 600, mb: 1 }}>Private Key</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', background: '#181a2a', borderRadius: 2, p: 1, mb: 2 }}>
            <Typography sx={{ color: 'white', fontFamily: 'monospace', fontSize: 15, wordBreak: 'break-all' }}>{generatedPrivateKey}</Typography>
            <IconButton onClick={() => handleCopy(generatedPrivateKey)} size="small" sx={{ color: 'white', ml: 1 }}>
              <CopyIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography sx={{ color: 'white', fontWeight: 600, mb: 1 }}>Public Address</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', background: '#181a2a', borderRadius: 2, p: 1 }}>
            <Typography sx={{ color: 'white', fontFamily: 'monospace', fontSize: 15, wordBreak: 'break-all' }}>{generatedPublicAddress}</Typography>
            <IconButton onClick={() => handleCopy(generatedPublicAddress)} size="small" sx={{ color: 'white', ml: 1 }}>
              <CopyIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <Typography sx={{ color: 'white', fontWeight: 500, fontSize: 15, mt: 2 }}>
          Please ensure that this private key is imported and saved before transferring any funds to it.
        </Typography>
      </StandardDialog>
      <LoadingDialog 
        open={isLoading}
        title="Minting Token"
        message={loadingMessage}
      />
    </Box>
  );
};

export default PrepareMintPump; 