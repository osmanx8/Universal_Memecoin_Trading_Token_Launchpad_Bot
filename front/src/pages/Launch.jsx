import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const LAUNCH_MODES = [
  { label: 'MEV BUNDLE', value: 'mev-bundle', path: '/mev-bundle' },
  { label: 'SNIPE BUNDLE', value: 'snipe-bundle', path: '/snipe-bundle' },
  { label: 'CHAINBUSTER', value: 'chainbuster', path: '/chainbuster' },
  { label: 'STAGGER MODE', value: 'stagger-mode', path: '/stagger-mode' },
  { label: 'MANUAL MODE', value: 'manual-mode', path: '/manual-mode' },
  { label: 'CTO MODE', value: 'cto-mode', path: '/cto-mode' },
  ];

const MODE_BOX_WIDTH = 180;
const MODE_BOX_HEIGHT = 120;

const Launch = () => {
  const { activeToken } = useTokens();
  const navigate = useNavigate();

  const handleModeSelect = (mode) => {
    // Navigate to the specific launch mode page
    navigate(mode.path);
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
        SELECT LAUNCH MODE
      </Typography>
      
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', mt: 2 }}>
        <Paper elevation={3} sx={{ 
          width: '100%', 
          maxWidth: 1200, 
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
          <Typography variant="h4" align="center" sx={{ mb: 4, color: 'white', fontWeight: 700, letterSpacing: 1, fontSize: 34 }}>
            LAUNCH MODES
          </Typography>

          <Grid container spacing={4} justifyContent="center">
            {LAUNCH_MODES.map((mode) => (
              <Grid item key={mode.value}>
                <Paper
                  sx={{
                    width: MODE_BOX_WIDTH,
                    height: MODE_BOX_HEIGHT,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)',
                    border: '1px solid rgba(192, 192, 192, 0.15)',
                    borderRadius: 3,
                    '&:hover': {
                      transform: 'translateY(-4px) scale(1.02)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(192, 192, 192, 0.3)',
                      background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.15) 0%, rgba(0, 0, 0, 0.9) 100%)',
                    },
                  }}
                  onClick={() => handleModeSelect(mode)}
                >
                  <Typography variant="h6" align="center" sx={{ 
                    fontWeight: 600, 
                    color: 'white',
                    fontSize: 16,
                    letterSpacing: 0.5
                  }}>
                    {mode.label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
};

export default Launch; 