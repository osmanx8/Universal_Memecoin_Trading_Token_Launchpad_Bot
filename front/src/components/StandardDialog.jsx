import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';

const StandardDialog = ({ 
  open, 
  onClose, 
  title, 
  children, 
  actions,
  icon,
  maxWidth = 'sm',
  fullWidth = true
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(124, 58, 237, 0.2)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        color: 'white',
        borderBottom: '1px solid rgba(124, 58, 237, 0.2)',
        padding: 2
      }}>
        {icon && React.cloneElement(icon, { sx: { color: 'rgba(124, 58, 237, 0.8)' } })}
        {title}
      </DialogTitle>
      <DialogContent sx={{ padding: 2 }}>
        {children}
      </DialogContent>
      {actions && (
        <DialogActions sx={{ 
          borderTop: '1px solid rgba(124, 58, 237, 0.2)',
          padding: 2
        }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default StandardDialog; 