import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Grid } from '@mui/material';

const PLATFORM_MODES = [
  { label: 'PUMP', value: 'pump', path: '/prepare-mint-pump' },
  { label: 'BONK', value: 'bonk', path: '/prepare-mint-bonk' },
];
const MODE_BOX_WIDTH = 220;
const MODE_BOX_HEIGHT = 120;

const PrepareMint = () => {
  const navigate = useNavigate();

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
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <Typography variant="h4" align="center" sx={{ mb: 4, color: 'white', fontWeight: 700, letterSpacing: 1, fontSize: 32, alignSelf: 'center' }}>
        Select a launch platform:
      </Typography>
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', mt: 2 }}>
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
          <Grid container spacing={4} justifyContent="center">
            {PLATFORM_MODES.map((mode) => (
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
                      border: '2px solid #C0C0C0',
                      background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.15) 0%, rgba(0, 0, 0, 0.9) 100%)',
                    },
                  }}
                  onClick={() => navigate(mode.path)}
                >
                  <Typography variant="h6" align="center" sx={{ 
                    fontWeight: 600, 
                    color: 'white',
                    fontSize: 18,
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

export default PrepareMint; 