import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import LaunchIcon from '@mui/icons-material/Launch';
import {
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { useTokens } from '../components/TokenContext';
import LoadingDialog from '../components/LoadingDialog';
import StandardDialog from '../components/StandardDialog';
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

const SnipeBundle = () => {
  // Metadata state
  const [metadata, setMetadata] = useState({
    name: '',
    symbol: '',
    description: '',
    website: '',
    twitter: '',
    telegram: '',
    imageUrl: ''
  });
  // Sniper funding state
  const [numSnipers, setNumSnipers] = useState('');
  const [totalBuy, setTotalBuy] = useState('');
  // Inputs for sniper table
  const [devSolBuy, setDevSolBuy] = useState('');
  // Inputs for MEV BUNDLE table
  const [mevDevSolBuy, setMevDevSolBuy] = useState('');
  const [mevWalletSolBuy, setMevWalletSolBuy] = useState('');
  const [mevSellJitoTip, setMevSellJitoTip] = useState('0.1');
  // Wallets state
  const [wallets, setWallets] = useState(() => {
    const saved = localStorage.getItem('wallets');
    return saved ? JSON.parse(saved) : Array.from({ length: 16 }, (_, i) => ({
      id: i,
      address: `Wallet${i}`,
      buyPercent: 0,
      solBuy: 0,
      solFund: 0.1
    }));
  });
  const [buyerWalletBalance, setBuyerWalletBalance] = useState(0);
  const { activeToken, setTokenLaunched, setTokenInfo } = useTokens();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showLaunchSuccess, setShowLaunchSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [newMetadataUri, setNewMetadataUri] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageChanged, setImageChanged] = useState(false);
  // Add state to control visibility of fund amount
  const [showFundAmount, setShowFundAmount] = useState(false);
  // Add state to store the calculated fund amount
  const [calculatedFundAmount, setCalculatedFundAmount] = useState('');
  // Add state to show warnings
  const [snipersWarning, setSnipersWarning] = useState('');
  const [buyWarning, setBuyWarning] = useState('');
  const [fundSnipersError, setFundSnipersError] = useState('');
  const [fundSnipersSuccess, setFundSnipersSuccess] = useState('');
  const [showFundSnipersSuccess, setShowFundSnipersSuccess] = useState(false);
  // Add state for wallet information
  const [tokenWallets, setTokenWallets] = useState({
    deployerWallet: '',
    buyerWallet: ''
  });
  const [isBuyerWalletFunded, setIsBuyerWalletFunded] = useState(false);
  const [txUrl, setTxUrl] = useState(null);
  const [txSig, setTxSig] = useState(null);
  const [success, setSuccess] = useState(false);


  // Ensure numSnipers and totalBuy are always numbers
  const numSnipersNum = Number(numSnipers) || 0;
  const totalBuyNum = Number(totalBuy) || 0;
  const extraFundRaw = 1.78 * Math.pow(numSnipersNum / 16, 0.62);
  const fundAmount = totalBuyNum + extraFundRaw + 0.02;
  const fundAmountFixed = fundAmount.toFixed(2);
  const maxTotalFund = 84;
  const fundEnough = buyerWalletBalance >= fundAmount;


  // Handle metadata change
  const handleMetaChange = (e) => {
    setMetadata({ ...metadata, [e.target.name]: e.target.value });
  };

  // Handle image file selection in Launch Preview
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImageChanged(true);
      // For preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setMetadata(m => ({ ...m, imageUrl: reader.result }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Handle save metadata
  const handleSaveMetadata = async () => {
    if (!activeToken) {
      return;
    }
    setIsSaving(true);
    try {
      // Prepare form data for IPFS upload
      const formData = new FormData();
      // Use new image if changed, else use original imageFile from token
      if (imageChanged && imageFile) {
        formData.append('file', imageFile);
      } else if (activeToken.imageFile) {
        formData.append('file', activeToken.imageFile);
      }
      formData.append('name', metadata.name);
      formData.append('symbol', metadata.symbol);
      formData.append('description', metadata.description);
      formData.append('twitter', metadata.twitter);
      formData.append('telegram', metadata.telegram);
      formData.append('website', metadata.website);
      formData.append('authKey', localStorage.getItem('authKey'));
      // Upload to IPFS
      const response = await axios.post('http://localhost:5000/api/metadata/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newUri = response.data.metadataUri;
      // Update backend with new metadata and URI
      await setTokenInfo(activeToken._id, {
        ...metadata,
        metadataUri: newUri,
        imageUrl: imageChanged ? metadata.imageUrl : activeToken.imageUrl,
        imageFile: imageChanged ? imageFile : activeToken.imageFile
      });
      setNewMetadataUri(newUri);
      setShowSaveSuccess(true);
      setImageFile(null);
      setImageChanged(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate buy amounts
  const handleCalculate = () => {
    // Simple even split
    const perWallet = (Number(totalBuy) || 0) / (Number(numSnipers) || 1);
    setWallets(Array.from({ length: Number(numSnipers) || 0 }, (_, i) => ({
      id: i,
      address: `Wallet${i + 1}`,
      buyPercent: 0,
      solBuy: perWallet,
      solFund: 0.1
    })));
    setShowFundAmount(true);
    setCalculatedFundAmount(fundAmountFixed);
  };

  // Save wallets whenever they change
  useEffect(() => {
    localStorage.setItem('wallets', JSON.stringify(wallets));
  }, [wallets]);

  // Check buyer wallet funding status when calculatedFundAmount or buyer wallet changes
  useEffect(() => {
    if (!tokenWallets.buyerWallet || !calculatedFundAmount) return;
    let cancelled = false;
    let intervalId = null;

    const checkBalance = () => {
      axios.post('http://localhost:5000/api/snipebundle/buyer-balance', {
        buyerWallet: tokenWallets.buyerWallet,
        requiredAmount: Number(calculatedFundAmount)
      }).then(res => {
        if (!cancelled) {
          const hasEnough = res.data.hasEnough;
          setIsBuyerWalletFunded(hasEnough);
          // Stop polling if wallet is funded
          if (hasEnough && intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      }).catch(() => {
        if (!cancelled) setIsBuyerWalletFunded(false);
      });
    };

    // Initial check
    checkBalance();

    // Start polling only if wallet is not funded
    if (!isBuyerWalletFunded) {
      intervalId = setInterval(checkBalance, 5000);
    }

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [tokenWallets.buyerWallet, calculatedFundAmount]);

  const handleLaunch = async () => {
    if (!activeToken) {
      alert('No active token selected');
      return;
    }

    if (!mevDevSolBuy || Number(mevDevSolBuy) <= 0) {
      alert('Please enter a valid dev buy amount');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Creating token on Pump.fun...');

    try {
      // Fetch the full token data from the API to get private keys and metadata URI
      const tokenResponse = await axios.get(`http://localhost:5000/api/mintedTokens/${activeToken._id}`);
      const fullTokenData = tokenResponse.data;

      // Fetch sniper wallets for this mint
      let sniperWallets = [];
      try {
        const snipersResponse = await axios.get(`http://localhost:5000/api/snipebundle/get-snipers/${activeToken._id}`);
        if (snipersResponse.data.success && snipersResponse.data.sniperWallets) {
          sniperWallets = snipersResponse.data.sniperWallets;
          console.log(`Found ${sniperWallets.length} sniper wallets for mint ${activeToken._id}`);
        }
      } catch (error) {
        console.log('No sniper wallets found or error fetching them:', error.message);
      }

      const response = await axios.post('http://localhost:5000/api/snipebundle/create-token', {
        deployerPrivateKey: fullTokenData.deployerPrivateKey,
        tokenMintPrivateKey: fullTokenData.tokenMintKeyPrivate,
        devBuyAmount: Number(mevDevSolBuy),
        mintId: activeToken._id,
        sniperWallets: sniperWallets // Include sniper wallets in the request
      });

      if (response.data.success) {
        setSuccess(true);
        setTxUrl(response.data.solscanUrl);
        setTxSig(response.data.signature);

        // Check if Jito bundle was successful
        if (response.data.jitoBundle && response.data.jitoBundle.success) {
          console.log('Jito bundle successful:', response.data.jitoBundle);
          setLoadingMessage(`Token created successfully! Jito bundle sent with ${response.data.jitoBundle.sniper_count} snipers.`);
        } else if (response.data.jitoBundle) {
          console.log('Jito bundle failed:', response.data.jitoBundle.error);
          setLoadingMessage(`Token created successfully! Jito bundle failed: ${response.data.jitoBundle.error}`);
        } else {
          setLoadingMessage('Token created successfully!');
        }

        setShowLaunchSuccess(true);
        console.log('Token creation successful:', response.data);
      } else {
        alert('Token creation failed: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error creating token:', error);
      alert('Token creation failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Add a placeholder function for handleFundSnipers
  const handleFundSnipers = async () => {
    setIsLoading(true);
    setLoadingMessage('Funding snipers...');

    try {
      const response = await axios.post('http://localhost:5000/api/snipebundle/fund-snipers', {
        numSnipers: Number(numSnipers),
        totalBuyAmount: Number(totalBuy), // Changed from totalBuy to totalBuyAmount to match backend
        mintId: activeToken?._id,
        authKey: localStorage.getItem('authKey'),
        buyerWalletPrivateKey: activeToken?.buyerWalletPrivateKey // Pass the buyer wallet private key
      });

      if (response.data.success) {
        setSuccess(true);
        setTxUrl(response.data.solscanUrl);
        setTxSig(response.data.signature);
        setFundSnipersSuccess(`Successfully generated ${response.data.sniperWallets.length} sniper wallets!`);
        setShowFundSnipersSuccess(false); // Hide the old dialog
        setFundSnipersError(''); // Hide error dialog if success
      } else {
        setSuccess(false);
        setFundSnipersError(response.data.message || 'Failed to fund snipers');
      }
    } catch (error) {
      console.error('Error funding snipers:', error);
      setFundSnipersError(error.response?.data?.message || 'Failed to fund snipers');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch token details including wallet information
  const fetchTokenDetails = async (tokenId) => {
    if (!tokenId) return;

    try {
      const response = await axios.get(`http://localhost:5000/api/mintedTokens/${tokenId}`);
      const tokenData = response.data;

      // Update wallet information
      setTokenWallets({
        deployerWallet: tokenData.deployerPublicKey || tokenData.token?.deployerPublicKey || '',
        buyerWallet: tokenData.buyerPublicKey || tokenData.token?.buyerPublicKey || ''
      });
    } catch (error) {
      console.error('Error fetching token details:', error);
    }
  };

  // Update metadata when activeToken changes
  useEffect(() => {
    if (activeToken) {
      setMetadata({
        name: activeToken.name || '',
        symbol: activeToken.symbol || '',
        description: activeToken.description || '',
        website: activeToken.website || '',
        twitter: activeToken.twitter || '',
        telegram: activeToken.telegram || '',
        imageUrl: activeToken.imageUrl || ''
      });
      // Reset image state when token changes
      setImageFile(null);
      setImageChanged(false);
      // Fetch token details including wallet information
      fetchTokenDetails(activeToken._id);
    } else {
      setMetadata({
        name: '',
        symbol: '',
        description: '',
        website: '',
        twitter: '',
        telegram: '',
        imageUrl: ''
      });
      // Clear wallet information
      setTokenWallets({
        deployerWallet: '',
        buyerWallet: ''
      });
    }
  }, [activeToken]);

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
            radial-gradient(circle at 90% 90%, rgba(192, 192, 192, 0.15) 0%, transparent 40%)
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
        SNIPE BUNDLE mode
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          ml: -14
        }}>
          {/* Metadata Section */}
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
            <Typography variant="h4" align="center" sx={{ mb: 3, color: 'white', fontWeight: 700, letterSpacing: 1, fontSize: 34 }}>
              SNIPE BUNDLE mode
            </Typography>
            <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 600, fontSize: 22 }}>Launch Preview</Typography>
            <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.12)' }} />
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'center' }}>
                <label htmlFor="launch-logo-upload">
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="launch-logo-upload"
                    type="file"
                    onChange={handleImageChange}
                  />
                  <Box sx={{ cursor: 'pointer' }}>
                    <TokenImage
                      key={activeToken?._id || 'no-token'}
                      src={imageChanged ? metadata.imageUrl : (activeToken?.imageUrl || '')}
                      size={120}
                    />
                  </Box>
                </label>
              </Grid>
              <Grid item xs={12} md={9}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Name" name="name" value={metadata.name} onChange={handleMetaChange} size="medium" sx={{ input: { color: 'white', fontSize: 18 }, label: { color: 'white', fontSize: 16 } }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Ticker" name="symbol" value={metadata.symbol} onChange={handleMetaChange} size="medium" sx={{ input: { color: 'white', fontSize: 18 }, label: { color: 'white', fontSize: 16 } }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Description" name="description" value={metadata.description} onChange={handleMetaChange} size="medium" multiline minRows={2} sx={{ input: { color: 'white', fontSize: 18 }, label: { color: 'white', fontSize: 16 } }} />
                  </Grid>
                </Grid>
              </Grid>
              {/* Second row: Web, X, TG */}
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Web" name="website" value={metadata.website} onChange={handleMetaChange} size="medium" sx={{ input: { color: 'white', fontSize: 18 }, label: { color: 'white', fontSize: 16 } }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="X" name="twitter" value={metadata.twitter} onChange={handleMetaChange} size="medium" sx={{ input: { color: 'white', fontSize: 18 }, label: { color: 'white', fontSize: 16 } }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="TG" name="telegram" value={metadata.telegram} onChange={handleMetaChange} size="medium" sx={{ input: { color: 'white', fontSize: 18 }, label: { color: 'white', fontSize: 16 } }} />
              </Grid>
              {/* Show Deployer and Buyer Wallets */}
              {tokenWallets.deployerWallet && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Deployer Wallet"
                    value={tokenWallets.deployerWallet}
                    InputProps={{ readOnly: true }}
                    size="medium"
                    sx={{
                      input: { color: '#00ffae', fontSize: 16, fontWeight: 500 },
                      label: { color: 'white', fontSize: 16 },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#00ffae',
                        }
                      }
                    }}
                  />
                </Grid>
              )}
              {tokenWallets.buyerWallet && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Buyer Wallet"
                    value={tokenWallets.buyerWallet}
                    InputProps={{ readOnly: true }}
                    size="medium"
                    sx={{
                      input: { color: '#00ffae', fontSize: 16, fontWeight: 500 },
                      label: { color: 'white', fontSize: 16 },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#00ffae',
                        }
                      }
                    }}
                  />
                </Grid>
              )}
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <UnifiedButton onClick={handleSaveMetadata}>
                Save
              </UnifiedButton>
            </Box>
          </Paper>
          {/* Fund Snipers Section */}
          <Paper elevation={3} sx={{
            width: '100%',
            p: 4,
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)',
            border: '1px solid rgba(192, 192, 192, 0.15)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            mb: 3
          }}>
            <Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 600, fontSize: 24 }}>
              Fund Snipers (Pumpfun)
            </Typography>
            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Number of Snipers"
                  type="number"
                  value={numSnipers}
                  onChange={e => {
                    let v = e.target.value;
                    setNumSnipers(v);
                    setSnipersWarning('');
                    if (v !== '' && (Number(v) < 1 || Number(v) > 19)) {
                      setSnipersWarning('Number of wallets must be between 1 and 19');
                    }
                  }}
                  inputProps={{ min: 1, max: 19 }}
                  sx={{ input: { color: 'white', fontSize: 18 }, label: { color: 'white', fontSize: 16 } }}
                  size="medium"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Total Sniper Buy Amount (SOL)"
                  type="number"
                  value={totalBuy}
                  onChange={e => {
                    let v = e.target.value;
                    setTotalBuy(v);
                    setBuyWarning('');
                    const extraFundLocal = 1.78 * Math.pow((Number(numSnipers) || 0) / 16, 0.62);
                    if (v !== '' && (Number(v) + extraFundLocal > maxTotalFund)) {
                      setBuyWarning('Total fund amount must not exceed 84 SOL');
                    }
                  }}
                  inputProps={{ min: 0, max: maxTotalFund - extraFundRaw, step: 0.01 }}
                  sx={{ input: { color: 'white', fontSize: 18 }, label: { color: 'white', fontSize: 16 } }}
                  size="medium"
                />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, flexDirection: 'column', alignItems: 'center' }}>
              <UnifiedButton onClick={handleCalculate} sx={{ mt: 2 }}>
                Calculate Buy Amounts
              </UnifiedButton>
            </Box>
            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
            {/* Sniper Information Table */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: 'white', flex: 1, fontSize: 20, fontWeight: 600 }}>Sniper Information</Typography>
              </Box>
              <Table size="medium" sx={{ background: 'rgba(255,255,255,0.01)', borderRadius: 2, mb: 0, width: '100%' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#C0C0C0', fontWeight: 400, fontFamily: 'Inter, sans-serif', fontSize: 14, borderBottom: '1.5px solid #C0C0C0', py: 1 }}>SNIPER ID</TableCell>
                    <TableCell sx={{ color: '#C0C0C0', fontWeight: 400, fontFamily: 'Inter, sans-serif', fontSize: 14, borderBottom: '1.5px solid #C0C0C0', py: 1 }}>TOKEN BUY %</TableCell>
                    <TableCell sx={{ color: '#C0C0C0', fontWeight: 400, fontFamily: 'Inter, sans-serif', fontSize: 14, borderBottom: '1.5px solid #C0C0C0', py: 1 }}>SOL BUY AMOUNT</TableCell>
                    <TableCell sx={{ color: '#C0C0C0', fontWeight: 400, fontFamily: 'Inter, sans-serif', fontSize: 14, borderBottom: '1.5px solid #C0C0C0', py: 1 }}>SOL FUND AMOUNT</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ color: 'white', borderBottom: 'none', fontSize: 16, py: 1 }}>dev</TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: 'none', fontSize: 16, py: 1 }}>5.00</TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: 'none', fontSize: 16, py: 1 }}>
                      <TextField
                        value={devSolBuy}
                        onChange={e => setDevSolBuy(e.target.value)}
                        size="small"
                        sx={{ input: { color: 'white', textAlign: 'center', fontSize: 16 }, background: 'rgba(255,255,255,0.03)', borderRadius: 1, width: 100 }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: 'none', fontSize: 16, py: 1 }}>N/A</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: 'white', borderBottom: 'none', fontSize: 16, py: 1 }}>sniper total</TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: 'none', fontSize: 16, py: 1 }}>0.00</TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: 'none', fontSize: 16, py: 1 }}>0.00</TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: 'none', fontSize: 16, py: 1 }}>
                      <TextField
                        value={calculatedFundAmount}
                        InputProps={{ readOnly: true }}
                        sx={{
                          input: {
                            color: calculatedFundAmount ? (isBuyerWalletFunded ? '#00ffae' : '#ff3b3b') : 'white',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: 1,
                            fontWeight: 600
                          },
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: calculatedFundAmount ? (isBuyerWalletFunded ? '#00ffae' : '#ff3b3b') : 'rgba(255,255,255,0.2)',
                              boxShadow: calculatedFundAmount ? (isBuyerWalletFunded ? '0 0 4px #00ffae' : '0 0 4px #ff3b3b') : 'none',
                            }
                          },
                          width: 180,
                          mb: 2
                        }}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
            {/* Add the Fund Snipers button below the Sniper Information table */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <UnifiedButton onClick={handleFundSnipers} sx={{ fontSize: 20, px: 4, py: 1.5 }}>
                ✦ Fund Snipers
              </UnifiedButton>
            </Box>
          </Paper>
          {/* MEV BUNDLE Section */}
          <Paper elevation={3} sx={{
            width: '100%',
            p: 4,
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)',
            border: '1px solid rgba(192, 192, 192, 0.15)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            mb: 2
          }}>
            <Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 600, fontSize: 24 }}>
              Launch (SNIPE BUNDLE)
            </Typography>
            <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 2 }}>
              <UnifiedButton sx={{ minWidth: 120, py: 1, fontSize: 17 }} size="medium">
                Refresh
              </UnifiedButton>
            </Box>
            <Table size="medium" sx={{ background: 'rgba(255,255,255,0.01)', borderRadius: 2, mb: 3, width: '100%' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#C0C0C0', fontWeight: 400, fontFamily: 'Inter, sans-serif', fontSize: 14, borderBottom: '1.5px solid #C0C0C0', py: 1 }}>SNIPER ID</TableCell>
                  <TableCell sx={{ color: '#C0C0C0', fontWeight: 400, fontFamily: 'Inter, sans-serif', fontSize: 14, borderBottom: '1.5px solid #C0C0C0', py: 1 }}>TOKEN BUY %</TableCell>
                  <TableCell sx={{ color: '#C0C0C0', fontWeight: 400, fontFamily: 'Inter, sans-serif', fontSize: 14, borderBottom: '1.5px solid #C0C0C0', py: 1 }}>SOL BUY AMOUNT</TableCell>
                  <TableCell sx={{ color: '#C0C0C0', fontWeight: 400, fontFamily: 'Inter, sans-serif', fontSize: 14, borderBottom: '1.5px solid #C0C0C0', py: 1 }}>AVAILABLE SOL</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ color: 'white', borderBottom: 'none', fontSize: 16, py: 1 }}>dev</TableCell>
                  <TableCell sx={{ color: 'white', borderBottom: 'none', fontSize: 16, py: 1 }}>5.00</TableCell>
                  <TableCell sx={{ color: 'white', borderBottom: 'none', fontSize: 16, py: 1 }}>
                    <TextField
                      value={mevDevSolBuy}
                      onChange={e => setMevDevSolBuy(e.target.value)}
                      size="small"
                      sx={{ input: { color: 'white', textAlign: 'center', fontSize: 16 }, background: 'rgba(255,255,255,0.03)', borderRadius: 1, width: 180 }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'white', borderBottom: 'none', fontSize: 16, py: 1 }}>0.000</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: 'white', borderBottom: 'none', fontSize: 16, py: 1 }}>MEV Wallet</TableCell>
                  <TableCell sx={{ color: 'white', borderBottom: 'none', fontSize: 16, py: 1 }}>57.005</TableCell>
                  <TableCell sx={{ color: 'white', borderBottom: 'none', fontSize: 16, py: 1 }}>
                    <TextField
                      value={mevWalletSolBuy}
                      onChange={e => setMevWalletSolBuy(e.target.value)}
                      size="small"
                      sx={{ input: { color: 'white', textAlign: 'center', fontSize: 16 }, background: 'rgba(255,255,255,0.03)', borderRadius: 1, width: 180 }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'white', borderBottom: 'none', fontSize: 16, py: 1 }}>0.001 ◎</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, mt: 3 }}>
              <UnifiedButton onClick={handleLaunch}>
                <LaunchIcon sx={{ mr: 1 }} /> Launch
              </UnifiedButton>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ color: 'white', fontWeight: 500, fontSize: 17 }}>
                  Snipe Sell Jito Tip:
                </Typography>
                <TextField
                  value={mevSellJitoTip}
                  onChange={e => setMevSellJitoTip(e.target.value)}
                  size="small"
                  sx={{ width: 120, input: { color: 'white', textAlign: 'center', fontSize: 17 }, background: 'rgba(255,255,255,0.03)', borderRadius: 1, mr: 1 }}
                  InputProps={{
                    endAdornment: <Typography sx={{ color: 'white', ml: 1, fontSize: 17 }}>SOL</Typography>
                  }}
                />
              </Box>
            </Box>
          </Paper>
        </Paper>
      </Box>
      <LoadingDialog
        open={isLoading}
        title="Launching Snipe Bundle"
        message={loadingMessage}
      />
      <StandardDialog
        open={showLaunchSuccess}
        onClose={() => setShowLaunchSuccess(false)}
        title="Snipe Bundle Successfully Launched"
        actions={
          <UnifiedButton onClick={() => setShowLaunchSuccess(false)} color="primary" variant="contained">
            Close
          </UnifiedButton>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Your token has been launched successfully!
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              View on Solscan:
            </Typography>
            <Button
              href="https://solscan.io"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: '#7c3aed',
                textTransform: 'none',
                '&:hover': {
                  color: '#a78bfa',
                  background: 'none'
                }
              }}
            >
              https://solscan.io
            </Button>
          </Box>
        </Box>
      </StandardDialog>
      {/* Popups */}
      <LoadingDialog open={isSaving} title="Updating Snipe Bundle Metadata" message="Uploading new metadata to IPFS..." />
      <StandardDialog
        open={showSaveSuccess}
        onClose={() => setShowSaveSuccess(false)}
        title="Snipe Bundle Metadata Updated"
        actions={<Button onClick={() => setShowSaveSuccess(false)} color="primary" variant="contained">Close</Button>}
      >
        <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
          Token metadata updated successfully!<br />
          {newMetadataUri && (
            <>
              <br />
              New Metadata URI: <a href={newMetadataUri} target="_blank" rel="noopener noreferrer" style={{ color: '#7c3aed', wordBreak: 'break-all' }}>{newMetadataUri}</a>
            </>
          )}
        </Typography>
      </StandardDialog>
      {/* Warning messages */}
      {snipersWarning && (
        <Typography sx={{ color: '#ff3b3b', fontSize: 14, mt: 0.5 }}>{snipersWarning}</Typography>
      )}
      {buyWarning && (
        <Typography sx={{ color: '#ff3b3b', fontSize: 14, mt: 0.5 }}>{buyWarning}</Typography>
      )}
      {/* Hide the old showFundSnipersSuccess and error dialogs if success is true: */}
      {!success && showFundSnipersSuccess && (
        <StandardDialog
          open={showFundSnipersSuccess}
          onClose={() => setShowFundSnipersSuccess(false)}
          title="Snipe Wallets Successfully Funded"
          actions={<UnifiedButton onClick={() => setShowFundSnipersSuccess(false)}>Close</UnifiedButton>}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {fundSnipersSuccess}
            </Typography>
          </Box>
        </StandardDialog>
      )}
      {/* Hide the old showFundSnipersSuccess and error dialogs if success is true: */}
      {!success && !!fundSnipersError && (
        <StandardDialog
          open={!!fundSnipersError}
          onClose={() => setFundSnipersError('')}
          title="Failed to Fund Snipe Wallets"
          actions={<UnifiedButton onClick={() => setFundSnipersError('')}>Close</UnifiedButton>}
        >
          <Typography sx={{ color: '#ff3b3b' }}>{fundSnipersError}</Typography>
        </StandardDialog>
      )}
      {success && txUrl && (
        <StandardDialog
          open={true}
          onClose={() => {
            setSuccess(false);
            setFundSnipersError('');
          }}
          title="Snipe Wallets Successfully Funded"
          actions={
            <UnifiedButton onClick={() => {
              setSuccess(false);
              setFundSnipersError('');
            }} color="primary" variant="contained">
              Close
            </UnifiedButton>
          }
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Your snipe wallets have been funded successfully!
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, maxWidth: 400, overflow: 'hidden' }}>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                View on Solscan:
              </Typography>
              <Button
                href={txUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: '#7c3aed',
                  textTransform: 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 350,
                  display: 'block',
                  fontSize: 14,
                  padding: 0,
                  minWidth: 0,
                  background: 'none',
                  '&:hover': {
                    color: '#a78bfa',
                    background: 'none'
                  }
                }}
              >
                {txUrl}
              </Button>
            </Box>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Signature: {txSig}
            </Typography>
          </Box>
        </StandardDialog>
      )}
    </Box>
  );
};

export default SnipeBundle; 