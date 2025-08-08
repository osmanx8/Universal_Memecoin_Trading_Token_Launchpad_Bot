import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { 
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useTokens } from '../components/TokenContext';
import TokenImage from '../components/TokenImage';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const StyledPaper = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)',
  border: '1px solid rgba(192, 192, 192, 0.15)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  borderRadius: 8,
  padding: theme.spacing(4),
}));

const StatBox = ({ title, value, color = 'white' }) => (
  <Box sx={{ p: 2 }}>
    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1, fontSize: '0.875rem' }}>
      {title}
    </Typography>
    <Typography variant="h5" sx={{ color, fontWeight: 600, letterSpacing: '-0.5px' }}>
      {value}
    </Typography>
  </Box>
);

// Sample data for the chart with purple gradient
const chartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      label: 'Profit/Loss',
      data: [0, 120, 180, 250, 320, 450, 580, 670, 890, 980, 1100, 1250],
      fill: true,
      borderColor: 'rgba(147, 51, 234, 0.8)',
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(147, 51, 234, 0.3)');
        gradient.addColorStop(1, 'rgba(147, 51, 234, 0)');
        return gradient;
      },
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: '#9333EA',
      pointBorderColor: 'rgba(147, 51, 234, 0.2)',
      pointHoverRadius: 6,
    },
  ],
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: '#0d0e12',
      padding: 12,
      titleFont: {
        size: 13,
        weight: '400',
      },
      bodyFont: {
        size: 13,
        weight: '400',
      },
      displayColors: false,
      callbacks: {
        label: (context) => `${context.parsed.y.toFixed(2)} SOL`,
      },
      borderColor: 'rgba(255, 255, 255, 0.05)',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.4)',
        font: {
          size: 11,
        },
      },
    },
    y: {
      display: false,  // This hides the entire Y axis
      grid: {
        display: false,
        drawBorder: false,
      },
    },
  },
};

const StatCard = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)',
  border: '1px solid rgba(192, 192, 192, 0.15)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  borderRadius: 8,
  overflow: 'hidden',
  width: 240,
  height: 110,
  flex: '0 0 auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  elevation: 3,
}));

const InfoCard = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)',
  border: '1px solid rgba(192, 192, 192, 0.15)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  borderRadius: 8,
  overflow: 'hidden',
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  width: '100%',
  elevation: 3,
}));

const PastLaunchCard = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)',
  border: '1px solid rgba(192, 192, 192, 0.15)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  borderRadius: 8,
  overflow: 'hidden',
  width: 400,
  minWidth: 280,
  maxWidth: '100%',
  padding: theme.spacing(2.2),
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'flex-start',
  elevation: 3,
}));

const UnifiedButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)',
  color: 'white',
  fontWeight: 600,
  fontSize: 18,
  borderRadius: 8,
  border: 'none !important',
  outline: 'none !important',
  boxShadow: 'none !important',
  transition: 'background 0.2s',
  '&:hover, &:focus, &:active': {
    background: 'linear-gradient(90deg, #6d28d9 0%, #7c3aed 100%)',
    border: 'none !important',
    outline: 'none !important',
    boxShadow: 'none !important',
  },
}));

const Account = () => {
  const [pastLaunches, setPastLaunches] = useState(() => {
    const saved = localStorage.getItem('pastLaunches');
    return saved ? JSON.parse(saved) : [];
  });
  const { tokens } = useTokens();

  // Mock data for demo
  const stats = [
    { label: 'All Time P/L', value: '92.93 SOL', color: '#00ffae' },
    { label: 'Total Launches', value: '6', color: 'white' },
    { label: 'Average P/L', value: '15.49 SOL', color: '#00ffae' },
    { label: 'All Time Costs', value: '60.73 SOL', color: '#00ffae' },
    { label: 'All Time Revenue', value: '153.66 SOL', color: '#00ffae' },
  ];
  const accountInfo = {
    authKey: 'xxx-xxx-xxx-xxx',
    authKeyExpiry: 'WED AUG 27 2025 21:18:06 GMT-0500 (CENTRAL DAYLIGHT TIME)',
    daysLeft: 99,
    vipLevel: 'Basic',
    taxRate: '8%'
  };
  const pastLaunchesDemo = [
    {
      name: 'ZELIA',
      mint: 'EQUKiMZ2KIGFxhUzWHrDvAK9LUaPbqXvUpzaiupump',
      description: 'Beyond orbit. Beneath knowing.',
      funded: '42.23 SOL',
      withdrawn: '134.32 SOL',
      pnl: '92.57 SOL',
      pnlColor: '#00ffae',
      migrated: true,
      launched: '5/19/2025, 4:51:22 PM',
      image: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Orange_circle.png',
    },
    {
      name: 'ZELIA',
      mint: 'XBUXmPsJupwGgfjeBb8jVWMM63q2bbsitSmLz5pump',
      description: 'Beyond orbit. Beneath knowing.',
      funded: '11.75 SOL',
      withdrawn: '12.91 SOL',
      pnl: '1.16 SOL',
      pnlColor: '#00ffae',
      migrated: false,
      launched: '5/19/2025, 4:23:22 PM',
      image: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Orange_circle.png',
    },
    {
      name: 'ZELIA',
      mint: 'BXTrG75zwfGJk3JwD3rwiAE48R25ewvRRzupump',
      description: 'Beyond orbit. Beneath knowing.',
      funded: 'N/A',
      withdrawn: 'N/A',
      pnl: 'N/A',
      pnlColor: '#ff3b3b',
      migrated: false,
      launched: 'N/A',
      image: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Orange_circle.png',
    },
    {
      name: 'ZELIA',
      mint: 'MNt8jgoMCsNCraKUM2wNDvcpBD6ewk5kdLapump',
      description: 'Beyond Orbit. Beneath Knowing.',
      funded: 'N/A',
      withdrawn: 'N/A',
      pnl: 'N/A',
      pnlColor: '#ff3b3b',
      migrated: false,
      launched: 'N/A',
      image: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Orange_circle.png',
    },
    {
      name: 'ZELIA',
      mint: 'v6jBBbE7gRBMYGZRNSwQ5zxH6Ab3LJh5wFhTSpump',
      description: 'Beyond orbit. Beneath knowing.',
      funded: '6.75 SOL',
      withdrawn: '6.44 SOL',
      pnl: '-0.31 SOL',
      pnlColor: '#ff3b3b',
      migrated: false,
      launched: '4/25/2025, 8:05:49 PM',
      image: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Orange_circle.png',
    },
    {
      name: 'JAMES',
      mint: 'XzZAr6VyLxBX9Z1UJraeRRd6s42rU6W2wCBepump',
      description: '',
      funded: 'N/A',
      withdrawn: 'N/A',
      pnl: 'N/A',
      pnlColor: '#ff3b3b',
      migrated: false,
      launched: 'N/A',
      image: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Orange_circle.png',
    },
  ];

  return (
    <Box
      className="hide-scrollbar"
      sx={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pt: 6,
        background: `
          radial-gradient(ellipse at top, rgba(192, 192, 192, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%),
          linear-gradient(90deg, rgba(192, 192, 192, 0.05) 1px, transparent 1px),
          linear-gradient(0deg, rgba(192, 192, 192, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 30px 30px, 30px 30px',
        position: 'relative',
        overflowY: 'auto',
        scrollbarGutter: 'stable',
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
      <Typography variant="subtitle1" sx={{ color: '#C0C0C0', fontWeight: 600, fontSize: 22, mb: 2, ml: { xs: 2, md: 8 }, alignSelf: 'flex-start' }}>
        Account
      </Typography>
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', mt: 2 }}>
        <Paper
          elevation={3}
          sx={{
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
          }}
        >
          <Typography variant="subtitle2" sx={{ color: '#C0C0C0', fontWeight: 500, fontSize: 18, mb: 2, alignSelf: 'flex-start' }}>
            My Account
          </Typography>
          {/* Stat Cards */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: 2,
            mb: 5,
            width: '100%',
            flexWrap: 'wrap',
            maxWidth: '100%',
          }}>
            {stats.map((stat, i) => (
              <StatCard key={stat.label}>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, mb: 1, textAlign: 'center' }}>{stat.label}</Typography>
                <Typography sx={{ color: '#C0C0C0', fontFamily: 'Orbitron, sans-serif', fontWeight: 700, fontSize: 28, textAlign: 'center' }}>{stat.value}</Typography>
              </StatCard>
            ))}
          </Box>
          {/* Account Info */}
          <Box sx={{ width: '100%', mb: 5 }}>
            <Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 600, fontSize: 22 }}>
              Account Information
            </Typography>
            <InfoCard sx={{ display: 'flex', flexDirection: 'column', gap: 4, py: 5, minHeight: 320 }}>
              {/* Auth Key */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <Typography sx={{ color: '#C0C0C0', fontWeight: 700, fontSize: 18, mb: 0.5, background: '#1a1b23', px: 2, py: 0.5, borderRadius: 2 }}>
                  Auth Key
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ color: '#C0C0C0', fontFamily: 'Orbitron, sans-serif', fontWeight: 700, fontSize: 18 }}>{accountInfo.authKey}</Typography>
                  <IconButton size="small" onClick={() => navigator.clipboard.writeText(accountInfo.authKey)} sx={{ color: '#a78bfa' }}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              {/* Auth Key Expiry */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <Typography sx={{ color: '#C0C0C0', fontWeight: 700, fontSize: 16, mb: 0.5 }}>
                  Auth Key Expiry
                </Typography>
                <Typography sx={{ color: '#C0C0C0', fontFamily: 'Orbitron, sans-serif', fontWeight: 700, fontSize: 16 }}>{accountInfo.authKeyExpiry}</Typography>
                <Typography sx={{ color: '#C0C0C0', fontFamily: 'Orbitron, sans-serif', fontWeight: 700, fontSize: 15, mt: 0.5 }}>
                  Expires in {accountInfo.daysLeft} days
                </Typography>
              </Box>
              {/* Vip Level */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <Typography sx={{ color: '#C0C0C0', fontWeight: 700, fontSize: 16, mb: 0.5 }}>
                  Vip Level
                </Typography>
                <Typography sx={{ color: '#C0C0C0', fontFamily: 'Orbitron, sans-serif', fontWeight: 700, fontSize: 16 }}>{accountInfo.vipLevel}</Typography>
              </Box>
              {/* Tax Rate */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <Typography sx={{ color: '#C0C0C0', fontWeight: 700, fontSize: 16, mb: 0.5 }}>
                  Tax Rate
                </Typography>
                <Typography sx={{ color: '#C0C0C0', fontFamily: 'Orbitron, sans-serif', fontWeight: 700, fontSize: 16 }}>{accountInfo.taxRate}</Typography>
              </Box>
            </InfoCard>
          </Box>
          {/* Past Launches */}
          <Box sx={{ width: '100%', mb: 4 }}>
            <Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 600, fontSize: 22 }}>
              Past Launches
            </Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {tokens.length === 0 && (
                <Typography sx={{ color: '#C0C0C0', fontSize: 16, ml: 2 }}>No tokens yet.</Typography>
              )}
              {tokens.map((token, i) => (
                <Grid item xs={12} sm={6} md={6} lg={6} key={token.id}>
                  <PastLaunchCard>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <TokenImage src={token.logo} size={60} />
                      <Box>
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                          {token.name}
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {token.symbol}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography sx={{ color: '#C0C0C0', fontWeight: 700, fontSize: 15, fontFamily: 'monospace', mb: 0.5, ml: 0.5 }}>
                      Mint: <span style={{ fontWeight: 400, fontFamily: 'monospace' }}>{token.id}</span>
                    </Typography>
                    <Typography sx={{ color: '#C0C0C0', fontWeight: 700, fontSize: 15, mb: 0.5, ml: 0.5 }}>
                      Description: <span style={{ fontWeight: 400 }}>{token.description || 'N/A'}</span>
                    </Typography>
                    <Typography sx={{ color: '#C0C0C0', fontWeight: 700, fontSize: 15, mb: 0.5, ml: 0.5 }}>
                      Funded: <span style={{ fontWeight: 400 }}>N/A</span>
                    </Typography>
                    <Typography sx={{ color: '#C0C0C0', fontWeight: 700, fontSize: 15, mb: 1.5, ml: 0.5 }}>
                      Withdrawn: <span style={{ fontWeight: 400 }}>N/A</span>
                    </Typography>
                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1 }}>
                      <Typography sx={{ color: '#ff3b3b', fontWeight: 700, fontSize: 18, mb: 0.5, textAlign: 'center' }}>
                        P/L: <span style={{ fontWeight: 700 }}>N/A</span>
                      </Typography>
                      <Typography sx={{ color: token.status === 'migrated' ? '#7c3aed' : '#fff', fontWeight: 700, fontSize: 20, mb: 0.5, textAlign: 'center' }}>
                        {token.status === 'migrated' ? 'Migrated' : 'Not Migrated'}
                      </Typography>
                      <Typography sx={{ color: '#C0C0C0', fontWeight: 700, fontSize: 15, textAlign: 'center' }}>
                        Launched: <span style={{ fontWeight: 400 }}>{token.status === 'launched' && token.launchDate ? new Date(token.launchDate).toLocaleString() : 'N/A'}</span>
                      </Typography>
                    </Box>
                  </PastLaunchCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Account; 