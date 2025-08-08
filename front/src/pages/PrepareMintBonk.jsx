import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const PrepareMintBonk = () => (
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
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', mt: 10 }}>
      <Paper elevation={3} sx={{ 
        width: '100%', 
        maxWidth: 700, 
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
        <Typography variant="h4" align="center" sx={{ mb: 4, color: 'white', fontWeight: 700, letterSpacing: 1, fontSize: 32 }}>
          Bonk support coming soon!
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 20, textAlign: 'center' }}>
          Only Pump is available for now.
        </Typography>
      </Paper>
    </Box>
  </Box>
);

export default PrepareMintBonk; 