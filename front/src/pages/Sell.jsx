import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import Switch from '@mui/material/Switch';
import { useTokens } from '../components/TokenContext';
import { toast } from 'react-toastify';
import StandardDialog from '../components/StandardDialog';

const StyledPaper = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)',
  borderRadius: 8,
  border: '1px solid rgba(192, 192, 192, 0.15)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
}));

const SellButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #e0e0e0 0%, #c0c0c0 50%, #e0e0e0 100%)',
  color: '#333333',
  fontWeight: 600,
  fontSize: 18,
  borderRadius: 8,
  marginBottom: theme.spacing(2),
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

const RedButton = styled(Button)(({ theme }) => ({
  border: '2px solid #ff3b3b',
  color: '#ff3b3b',
  fontWeight: 600,
  fontSize: 16,
  borderRadius: 8,
  marginBottom: theme.spacing(1.5),
  background: 'rgba(255, 59, 59, 0.05)',
  outline: 'none !important',
  boxShadow: 'none !important',
  transition: 'background 0.2s',
  '&:hover, &:focus, &:active': {
    background: 'rgba(255, 59, 59, 0.12)',
    border: '2px solid #ff3b3b',
    outline: 'none !important',
    boxShadow: 'none !important',
  },
}));

const QuickActionButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #e0e0e0 0%, #c0c0c0 50%, #e0e0e0 100%)',
  color: '#333333',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  fontWeight: 600,
  fontSize: 17,
  borderRadius: 8,
  marginBottom: theme.spacing(2),
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

const BuyButton = styled(Button)(({ theme }) => ({
  background: '#22c55e',
  color: 'white',
  fontWeight: 600,
  fontSize: 16,
  borderRadius: 6,
  minWidth: 70,
  border: 'none',
  outline: 'none !important',
  boxShadow: 'none !important',
  transition: 'background 0.2s',
  '&:hover, &:focus, &:active': {
    background: '#16a34a',
    border: 'none',
    outline: 'none !important',
    boxShadow: 'none !important',
  },
}));

const SendButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #e0e0e0 0%, #c0c0c0 50%, #e0e0e0 100%)',
  color: '#333333',
  fontWeight: 600,
  fontSize: 16,
  borderRadius: 6,
  minWidth: 70,
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

const mockBalances = [
  { id: 'dev', token: '0.00%', sol: '0.00', buy: '', send: '' },
  { id: '0', token: '0.00%', sol: '0.00', buy: '', send: '' },
  { id: '1', token: '0.00%', sol: '0.00', buy: '', send: '' },
  { id: '2', token: '0.00%', sol: '0.00', buy: '', send: '' },
  { id: '3', token: '0.00%', sol: '0.00', buy: '', send: '' },
];

const Sell = () => {
  const [sellInput, setSellInput] = useState('');
  const [buyDialog, setBuyDialog] = useState({ open: false, sniperId: null });
  const [sendDialog, setSendDialog] = useState({ open: false, sniperId: null });
  const [buyAmount, setBuyAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [sendPercent, setSendPercent] = useState('');
  const [manualMigrateOpen, setManualMigrateOpen] = useState(false);
  const [quickSendOpen, setQuickSendOpen] = useState(false);
  const [quickSendAddress, setQuickSendAddress] = useState('');
  const [quickSendPercent, setQuickSendPercent] = useState('');
  const [withdrawSolOpen, setWithdrawSolOpen] = useState(false);
  const [withdrawSolAmount, setWithdrawSolAmount] = useState('0');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [useJito, setUseJito] = useState(false);
  const [usePercent, setUsePercent] = useState(true);
  const [jitoTip, setJitoTip] = useState('0.0043');
  const { activeToken, setTokenMigrated } = useTokens();

  // API base URL - adjust this to match your backend
  const API_BASE_URL = 'http://localhost:5000/api';

  // Helper function to make API calls
  const apiCall = async (endpoint, data) => {
    try {
      console.log(`Making API call to: ${API_BASE_URL}${endpoint}`);
      console.log('Request data:', data);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('API response:', result);
      return result;
    } catch (error) {
      console.error('API call failed:', error);
      if (error.message === 'Failed to fetch') {
        console.error('This usually means the backend server is not running on port 5000');
        console.error('Please make sure your backend server is started with: cd back && npm start');
      }
      throw error;
    }
  };

  // Sell tokens from available wallets (excluding dev)
  const handleSellTokens = async () => {
    if (!activeToken || !sellInput || sellInput <= 0) {
      toast.error('Please enter a valid percentage to sell');
      return;
    }

    // Debug: Log the activeToken to see its structure
    console.log('Active token:', activeToken);
    console.log('Active token mintKey:', activeToken.mintKey);
    console.log('Active token _id:', activeToken._id);

    try {
      // Get auth key from localStorage or context
      const authKey = localStorage.getItem('authKey'); // Adjust based on your auth system
      if (!authKey) {
        toast.error('Authentication required');
        return;
      }

      const requestData = {
        authKey: authKey,
        sellAmount: parseFloat(sellInput),
        useJito,
        jitoTip: parseFloat(jitoTip),
        usePercent: true
      };

      console.log('Sending request data:', requestData);

      const result = await apiCall('/sell/sell-from-multiple-wallets', requestData);

      if (result.success) {
        toast.success(`Successfully sold ${sellInput}% from ${result.data.successfulSells} wallets`);
        setSellInput('');
      } else {
        toast.error(result.error || 'Sell operation failed');
      }
    } catch (error) {
      toast.error(`Sell failed: ${error.message}`);
    }
  };

  // Sell all sniper wallets (excluding dev)
  const handleSellAllSniperWallets = async () => {
    if (!activeToken) {
      toast.error('No active token selected');
      return;
    }

    try {
      const authKey = localStorage.getItem('authKey');
      if (!authKey) {
        toast.error('Authentication required');
        return;
      }

      const result = await apiCall('/sell/sell-all-sniper-wallets', {
        authKey: authKey,
        useJito,
        jitoTip: parseFloat(jitoTip)
      });

      if (result.success) {
        toast.success(`Successfully sold all tokens from ${result.data.successfulSells} sniper wallets`);
      } else {
        toast.error(result.error || 'Sell all sniper wallets failed');
      }
    } catch (error) {
      toast.error(`Sell all sniper wallets failed: ${error.message}`);
    }
  };

  // Sell all dev tokens
  const handleSellAllDevTokens = async () => {
    if (!activeToken) {
      toast.error('No active token selected');
      return;
    }

    try {
      const authKey = localStorage.getItem('authKey');
      if (!authKey) {
        toast.error('Authentication required');
        return;
      }

      const result = await apiCall('/sell/sell-all-dev-tokens', {
        authKey: authKey,
        useJito,
        jitoTip: parseFloat(jitoTip)
      });

      if (result.success) {
        toast.success('Successfully sold all dev tokens');
      } else {
        toast.error(result.error || 'Sell all dev tokens failed');
      }
    } catch (error) {
      toast.error(`Sell all dev tokens failed: ${error.message}`);
    }
  };

  // Sell 50% dev tokens
  const handleSellHalfDevTokens = async () => {
    if (!activeToken) {
      toast.error('No active token selected');
      return;
    }

    try {
      const authKey = localStorage.getItem('authKey');
      if (!authKey) {
        toast.error('Authentication required');
        return;
      }

      const result = await apiCall('/sell/sell-half-dev-tokens', {
        authKey: authKey,
        useJito,
        jitoTip: parseFloat(jitoTip)
      });

      if (result.success) {
        toast.success('Successfully sold 50% of dev tokens');
      } else {
        toast.error(result.error || 'Sell 50% dev tokens failed');
      }
    } catch (error) {
      toast.error(`Sell 50% dev tokens failed: ${error.message}`);
    }
  };

  // MEV sell and rebuy
  const handleMevSellAndRebuy = async () => {
    if (!activeToken) {
      toast.error('No active token selected');
      return;
    }

    try {
      const authKey = localStorage.getItem('authKey');
      if (!authKey) {
        toast.error('Authentication required');
        return;
      }

      const result = await apiCall('/sell/mev-sell-and-rebuy', {
        authKey: authKey,
        useJito,
        jitoTip: parseFloat(jitoTip),
        rebuyAmount: 0.1 // SOL to rebuy with
      });

      if (result.success) {
        toast.success('MEV sell and rebuy completed successfully');
      } else {
        toast.error(result.error || 'MEV sell and rebuy failed');
      }
    } catch (error) {
      toast.error(`MEV sell and rebuy failed: ${error.message}`);
    }
  };

  // Withdraw SOL from wallets
  const handleWithdrawSol = async () => {
    if (!activeToken) {
      toast.error('No active token selected');
      return;
    }

    try {
      const authKey = localStorage.getItem('authKey');
      if (!authKey) {
        toast.error('Authentication required');
        return;
      }

      // You'll need to get the destination wallet from user input or settings
      const destinationWalletPrivateKey = 'destination_wallet_private_key'; // This should come from user input

      const result = await apiCall('/sell/withdraw-sol', {
        mintId: activeToken._id,
        authKey: authKey,
        amountToLeave: parseFloat(withdrawSolAmount),
        destinationWalletPrivateKey,
        useJito,
        jitoTip: parseFloat(jitoTip)
      });

      if (result.success) {
        toast.success(`Successfully withdrew SOL from ${result.data.successfulWithdraws} wallets`);
        setWithdrawSolOpen(false);
      } else {
        toast.error(result.error || 'Withdraw SOL failed');
      }
    } catch (error) {
      toast.error(`Withdraw SOL failed: ${error.message}`);
    }
  };

  const handleOpenBuy = (sniperId) => {
    setBuyDialog({ open: true, sniperId });
    setBuyAmount('');
  };
  const handleOpenSend = (sniperId) => {
    setSendDialog({ open: true, sniperId });
    setSendAddress('');
    setSendPercent('');
  };
  const handleCloseBuy = () => setBuyDialog({ open: false, sniperId: null });
  const handleCloseSend = () => setSendDialog({ open: false, sniperId: null });

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
        Sell
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
          ml: -14, 
          position: 'relative' 
        }}>
          <Grid container spacing={0} sx={{ width: '100%', mb: 4 }}>
            <Grid item xs={12} md={6} sx={{ pr: { md: 2 } }}>
              <StyledPaper sx={{ p: 4, height: '100%' }}>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 2, fontSize: 24 }}>
                  Sell Tokens
                </Typography>
                <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.12)' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography sx={{ color: 'white', fontWeight: 500, fontSize: 18, mr: 2 }}>Balance:</Typography>
                  <Typography sx={{ color: '#ff3b3b', fontWeight: 700, fontSize: 18, mr: 2 }}>0.00%</Typography>
                  <Typography sx={{ color: '#ff3b3b', fontWeight: 700, fontSize: 18 }}>0.00 SOL</Typography>
                </Box>
                <TextField
                  fullWidth
                  placeholder="% supply to sell"
                  value={sellInput}
                  onChange={e => setSellInput(e.target.value)}
                  sx={{
                    mb: 3,
                    input: { color: 'white', fontSize: 18 },
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 2,
                    label: { color: 'white', fontSize: 16 },
                  }}
                  size="medium"
                />
                <SellButton 
                  fullWidth 
                  sx={{ mb: 2, py: 1.5, fontSize: 18 }}
                  onClick={handleSellTokens}
                >
                  Sell Tokens
                </SellButton>
                <RedButton 
                  fullWidth 
                  sx={{ mb: 2, py: 1.5, fontSize: 18 }}
                  onClick={handleSellAllSniperWallets}
                >
                  Sell All Sniper Wallets
                </RedButton>
                <RedButton 
                  fullWidth 
                  sx={{ mb: 2, py: 1.5, fontSize: 18 }}
                  onClick={handleSellAllDevTokens}
                >
                  Sell All Dev Tokens
                </RedButton>
                <RedButton 
                  fullWidth 
                  sx={{ mb: 2, py: 1.5, fontSize: 18 }}
                  onClick={handleSellHalfDevTokens}
                >
                  Sell 50% Dev Tokens
                </RedButton>
              </StyledPaper>
            </Grid>
            <Grid item xs={12} md={6} sx={{ pl: { md: 2 } }}>
              <StyledPaper sx={{ p: 4, borderRadius: 8, overflow: 'hidden', height: '100%' }}>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 2, fontSize: 24 }}>
                  Quick Actions
                </Typography>
                <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.12)' }} />
                <SellButton fullWidth sx={{ mb: 2, py: 1.5, fontSize: 18 }}>Refresh Balances</SellButton>
                <SellButton fullWidth sx={{ mb: 2, py: 1.5, fontSize: 18 }}>Autodistribute</SellButton>
                <SellButton 
                  fullWidth 
                  sx={{ mb: 2, py: 1.5, fontSize: 18 }}
                  onClick={handleMevSellAndRebuy}
                >
                  Sell MEV Sniper + Rebuy
                </SellButton>
                <QuickActionButton 
                  fullWidth 
                  green 
                  sx={{ mb: 2, py: 1.5, fontSize: 18 }} 
                  onClick={() => setWithdrawSolOpen(true)}
                >
                  Withdraw Sol
                </QuickActionButton>
                <SellButton fullWidth sx={{ mb: 2, py: 1.5, fontSize: 18 }} onClick={() => setQuickSendOpen(true)}>Send Tokens</SellButton>
                <SellButton fullWidth sx={{ mb: 2, py: 1.5, fontSize: 18 }} onClick={() => setManualMigrateOpen(true)}>Manual Migrate</SellButton>
              </StyledPaper>
            </Grid>
          </Grid>
          <StyledPaper sx={{ p: 4, width: '100%' }}>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 2, fontSize: 24 }}>
              Current Balances Information
            </Typography>
            <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.12)' }} />
            <Table sx={{ background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)', borderRadius: 2, width: '100%' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#C0C0C0', fontWeight: 400, fontFamily: 'Inter, sans-serif', fontSize: 14, borderBottom: '1.5px solid #C0C0C0', py: 1 }}>SNIPER ID</TableCell>
                  <TableCell sx={{ color: '#C0C0C0', fontWeight: 400, fontFamily: 'Inter, sans-serif', fontSize: 14, borderBottom: '1.5px solid #C0C0C0', py: 1 }}>TOKEN BALANCE</TableCell>
                  <TableCell sx={{ color: '#C0C0C0', fontWeight: 400, fontFamily: 'Inter, sans-serif', fontSize: 14, borderBottom: '1.5px solid #C0C0C0', py: 1 }}>SOL BALANCE</TableCell>
                  <TableCell sx={{ color: '#C0C0C0', fontWeight: 400, fontFamily: 'Inter, sans-serif', fontSize: 14, borderBottom: '1.5px solid #C0C0C0', py: 1 }}>BUY TOKENS</TableCell>
                  <TableCell sx={{ color: '#C0C0C0', fontWeight: 400, fontFamily: 'Inter, sans-serif', fontSize: 14, borderBottom: '1.5px solid #C0C0C0', py: 1 }}>SEND TOKENS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ color: '#C0C0C0', fontWeight: 400, fontFamily: 'Inter, sans-serif', fontSize: 14, borderBottom: '1.5px solid #C0C0C0', py: 1 }}>Total</TableCell>
                  <TableCell sx={{ color: '#C0C0C0', fontWeight: 400, fontFamily: 'Inter, sans-serif', fontSize: 14, borderBottom: '1.5px solid #C0C0C0', py: 1 }}>0.00%</TableCell>
                  <TableCell sx={{ color: '#C0C0C0', fontWeight: 400, fontFamily: 'Inter, sans-serif', fontSize: 14, borderBottom: '1.5px solid #C0C0C0', py: 1 }}>0.000 SOL</TableCell>
                  <TableCell sx={{ color: '#C0C0C0', fontWeight: 400, fontFamily: 'Inter, sans-serif', fontSize: 14, borderBottom: '1.5px solid #C0C0C0', py: 1 }}></TableCell>
                  <TableCell sx={{ color: '#C0C0C0', fontWeight: 400, fontFamily: 'Inter, sans-serif', fontSize: 14, borderBottom: '1.5px solid #C0C0C0', py: 1 }}></TableCell>
                </TableRow>
                {mockBalances.filter(row => row.id !== 'dev' && row.id !== 'Total').map((row, i) => (
                  <TableRow key={row.id}>
                    <TableCell sx={{ color: 'white', fontWeight: 400, fontFamily: 'Inter, sans-serif', fontSize: 14, borderBottom: '1.5px solid #C0C0C0', py: 1 }}>{row.id}</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 400, fontFamily: 'Inter, sans-serif', fontSize: 14, borderBottom: '1.5px solid #C0C0C0', py: 1 }}>{row.token}</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 400, fontFamily: 'Inter, sans-serif', fontSize: 14, borderBottom: '1.5px solid #C0C0C0', py: 1 }}>{row.sol}</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 400, fontFamily: 'Inter, sans-serif', fontSize: 14, borderBottom: '1.5px solid #C0C0C0', py: 1 }}>
                      <BuyButton onClick={() => handleOpenBuy(row.id)}>Buy</BuyButton>
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 400, fontFamily: 'Inter, sans-serif', fontSize: 14, borderBottom: '1.5px solid #C0C0C0', py: 1 }}>
                      <SendButton onClick={() => handleOpenSend(row.id)}>Send</SendButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </StyledPaper>
        </Paper>
      </Box>
      <StandardDialog
        open={buyDialog.open}
        onClose={handleCloseBuy}
        title={`Sniper ${buyDialog.sniperId}: Buy tokens`}
        actions={
          <>
            <BuyButton onClick={handleCloseBuy}>Buy</BuyButton>
            <Button onClick={handleCloseBuy} sx={{ color: 'white', ml: 2 }}>Close</Button>
          </>
        }
      >
        <TextField
          fullWidth
          placeholder="Amount Sol To Buy"
          value={buyAmount}
          onChange={e => setBuyAmount(e.target.value)}
          sx={{ input: { color: 'white', fontSize: 18 }, background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)', borderRadius: 2 }}
        />
      </StandardDialog>

      <StandardDialog
        open={sendDialog.open}
        onClose={handleCloseSend}
        title={`Sniper ${sendDialog.sniperId}: Send tokens`}
        actions={
          <>
            <BuyButton onClick={handleCloseSend}>Send</BuyButton>
            <Button onClick={handleCloseSend} sx={{ color: 'white', ml: 2 }}>Close</Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Destination Address"
            value={sendAddress}
            onChange={e => setSendAddress(e.target.value)}
            sx={{ input: { color: 'white', fontSize: 18 }, background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)', borderRadius: 2 }}
          />
          <TextField
            fullWidth
            placeholder="% supply to send"
            value={sendPercent}
            onChange={e => setSendPercent(e.target.value)}
            sx={{ input: { color: 'white', fontSize: 18 }, background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)', borderRadius: 2 }}
          />
        </Box>
      </StandardDialog>

      <StandardDialog
        open={manualMigrateOpen}
        onClose={() => setManualMigrateOpen(false)}
        title="Migrate to Pumpswap [Emergency]"
        maxWidth="md"
      >
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2, fontSize: 20 }}>
          Manual Migrate (Emergency Only)
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
          <InfoOutlinedIcon sx={{ color: '#C0C0C0', mt: 0.5, mr: 1 }} />
          <Typography sx={{ color: '#C0C0C0', fontSize: 16 }}>
            <span style={{ color: '#ff3b3b', fontWeight: 700 }}>[DO NOT USE UNLESS THIS IS AN EMERGENCY]</span> Use this button if your token has migrated to pumpswap, but it didnt migrate on bundle labs. You can check this in your account page under Past Launches, if it says Migrated To Pumpswap then it has migrated successfully. If your coin already says Migrated To Pumpswap and you click this button, it will switch back to Not Migrated.
          </Typography>
        </Box>
        <BuyButton fullWidth sx={{ fontSize: 18, py: 1.5, mt: 2 }} onClick={() => {
          if (activeToken) {
            setTokenMigrated(activeToken.id);
            toast.success('Token migrated!');
          }
          setManualMigrateOpen(false);
        }}>
          Manual Migrate
        </BuyButton>
      </StandardDialog>

      <StandardDialog
        open={quickSendOpen}
        onClose={() => setQuickSendOpen(false)}
        title="Send tokens from any sniper"
        maxWidth="md"
      >
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Destination Address"
            value={quickSendAddress}
            onChange={e => setQuickSendAddress(e.target.value)}
            sx={{ input: { color: 'white', fontSize: 18 }, background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)', borderRadius: 2 }}
          />
          <TextField
            fullWidth
            placeholder="% supply to send"
            value={quickSendPercent}
            onChange={e => setQuickSendPercent(e.target.value)}
            sx={{ input: { color: 'white', fontSize: 18 }, background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)', borderRadius: 2 }}
          />
          <BuyButton sx={{ minWidth: 120, fontSize: 16, ml: 1, px: 3, py: 1 }} onClick={() => setQuickSendOpen(false)}>
            Send
          </BuyButton>
        </Box>
      </StandardDialog>

      <StandardDialog
        open={withdrawSolOpen}
        onClose={() => setWithdrawSolOpen(false)}
        title="Withdraw Sol from snipers"
        maxWidth="md"
      >
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Amount Of Sol To Leave In Each Sniper"
            value={withdrawSolAmount}
            onChange={e => setWithdrawSolAmount(e.target.value)}
            sx={{ input: { color: 'white', fontSize: 18 }, background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)', borderRadius: 2 }}
          />
          <BuyButton 
            sx={{ minWidth: 160, fontSize: 16, ml: 1, px: 3, py: 1 }} 
            onClick={handleWithdrawSol}
          >
            Withdraw Sol
          </BuyButton>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <InfoOutlinedIcon sx={{ color: '#C0C0C0', mr: 1, fontSize: 22 }} />
          <Typography sx={{ color: '#C0C0C0', fontSize: 15 }}>
            Use 0 to withdraw all SOL
          </Typography>
        </Box>
      </StandardDialog>

      <StandardDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Sell Settings"
        icon={<SettingsIcon />}
        actions={
          <>
            <Button 
              onClick={() => setSettingsOpen(false)}
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => setSettingsOpen(false)}
              variant="contained"
              sx={{
                background: 'linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(90deg, #6d28d9 0%, #7c3aed 100%)',
                },
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Switch 
              checked={useJito} 
              onChange={e => setUseJito(e.target.checked)}
              sx={{ 
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#C0C0C0' },
                '& .MuiSwitch-track': { background: '#C0C0C0' }
              }}
            />
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 16 }}>
              Use Jito for sells
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Switch 
              checked={usePercent} 
              onChange={e => setUsePercent(e.target.checked)}
              sx={{ 
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#C0C0C0' },
                '& .MuiSwitch-track': { background: '#C0C0C0' }
              }}
            />
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 16 }}>
              Use percentage supply (%) for token amounts
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 16 }}>
              Custom Jito Tip:
            </Typography>
            <Box sx={{ 
              background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)', 
              borderRadius: 2, 
              px: 2, 
              py: 0.5, 
              minWidth: 80, 
              display: 'flex', 
              alignItems: 'center',
              border: '1px solid rgba(192, 192, 192, 0.15)'
            }}>
              <input 
                value={jitoTip} 
                onChange={e => setJitoTip(e.target.value)} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'white', 
                  fontSize: 16, 
                  width: 60, 
                  outline: 'none', 
                  fontFamily: 'inherit', 
                  textAlign: 'center' 
                }} 
              />
            </Box>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 16 }}>
              SOL
            </Typography>
          </Box>
        </Box>
      </StandardDialog>
    </Box>
  );
};

export default Sell; 