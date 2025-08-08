import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';

const LoadingDialog = ({ open, title, message }) => {
  return (
    <Dialog
      open={open}
      PaperProps={{
        sx: {
          background: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(124, 58, 237, 0.2)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          borderRadius: 2,
          minWidth: 300,
          maxWidth: 400,
        }
      }}
    >
      <DialogContent sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress 
            size={40} 
            thickness={4}
            sx={{ 
              color: '#7c3aed',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              }
            }} 
          />
          <Typography sx={{ color: '#bdbdfc', fontWeight: 600, fontSize: 20 }}>
            {title}
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 16 }}>
            {message}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default LoadingDialog; 