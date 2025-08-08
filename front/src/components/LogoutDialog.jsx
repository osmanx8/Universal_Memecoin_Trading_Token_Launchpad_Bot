import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

const LogoutDialog = ({ open, onClose, onConfirm }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(124, 58, 237, 0.2)',
          backdropFilter: 'blur(10px)',
          color: 'white',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        color: 'white',
        borderBottom: '1px solid rgba(124, 58, 237, 0.2)'
      }}>
        <LogoutIcon sx={{ color: 'rgba(124, 58, 237, 0.8)' }} />
        Confirm Logout
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 2 }}>
          Are you sure you want to log out?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ 
        borderTop: '1px solid rgba(124, 58, 237, 0.2)',
        padding: 2
      }}>
        <Button 
          onClick={onClose}
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
          onClick={onConfirm}
          variant="contained"
          sx={{
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 0, 0, 0.3)',
            },
          }}
        >
          Logout
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LogoutDialog; 