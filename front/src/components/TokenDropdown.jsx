import React, { useState } from 'react';
import { useTokens } from './TokenContext';
import { Box, Popper, Paper, MenuItem, Typography, Avatar } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const statusColor = status => {
  if (status === 'launched') return '#4ade80';
  return '#fbbf24';
};

export default function TokenDropdown() {
  const { tokens, activeToken, setActiveToken } = useTokens();
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setOpen(!open);
  };

  const handleSelect = (tokenId) => {
    setActiveToken(tokenId);
    setOpen(false);
  };

  if (!tokens.length) {
    return (
      <Box sx={{ minWidth: 220, p: 1, background: 'rgba(20,20,40,0.95)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bdbdfc', fontWeight: 500, fontSize: 16 }}>
        No tokens
      </Box>
    );
  }

  // Shorten CA: first 5, ..., last 4
  const shortenCA = (ca) => {
    if (!ca || typeof ca !== 'string') return '';
    if (ca.length > 9) {
      const first = ca.slice(0, 5);
      const last = ca.slice(-4);
      return `${first}...${last}`;
    }
    return ca;
  };

  return (
    <>
      <Box
        onClick={handleClick}
        sx={{
          minWidth: 220,
          background: 'rgba(20,20,40,0.95)',
          borderRadius: 3,
          color: '#bdbdfc',
          fontWeight: 500,
          fontSize: 16,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          border: '1px solid rgba(124, 58, 237, 0.3)',
          boxShadow: '0 2px 8px 0 rgba(31,38,135,0.12)',
          '&:hover': { 
            background: 'rgba(30,30,60,1)',
            border: '1px solid rgba(124, 58, 237, 0.5)',
          },
        }}
      >
        {activeToken ? (
          <>
            {activeToken.imageUrl ? (
              <Avatar src={activeToken.imageUrl} sx={{ width: 24, height: 24, mr: 1 }} />
            ) : (
              <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: '#23234a', fontSize: 14 }}>{activeToken.symbol?.[0] || '?'}</Avatar>
            )}
            <Typography sx={{ color: '#bdbdfc', fontWeight: 600, fontSize: 16 }}>{activeToken.name}</Typography>
            <Typography sx={{ color: '#7c3aed', fontWeight: 500, fontSize: 14, ml: 1 }}>{shortenCA(activeToken.mintKey)}</Typography>
          </>
        ) : (
          'Select token'
        )}
        <ArrowDropDownIcon sx={{ color: '#a78bfa', ml: 'auto' }} />
      </Box>
      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-end"
        sx={{ zIndex: 1300 }}
      >
        <Paper
          sx={{
            mt: 1,
            background: 'rgba(20,20,40,0.98)',
            color: '#bdbdfc',
            borderRadius: 3,
            boxShadow: '0 8px 32px 0 rgba(31,38,135,0.25)',
            maxHeight: 224,
            overflowY: 'auto',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            '&::-webkit-scrollbar': {
              width: '10px',
              background: 'rgba(124, 58, 237, 0.08)',
              borderRadius: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(124, 58, 237, 0.35)',
              borderRadius: '8px',
              minHeight: 24,
            },
          }}
        >
          {tokens.map(token => (
            <MenuItem
              key={token._id}
              onClick={() => handleSelect(token._id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: 1.5,
                px: 2,
                fontSize: 17,
                borderRadius: 2,
                transition: 'background 0.18s',
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(124, 58, 237, 0.22)',
                  color: '#fff',
                },
              }}
            >
              {token.imageUrl ? (
                <Avatar src={token.imageUrl} sx={{ width: 28, height: 28, mr: 1 }} />
              ) : (
                <Avatar sx={{ width: 28, height: 28, mr: 1, bgcolor: '#23234a', fontSize: 15 }}>{token.symbol?.[0] || '?'}</Avatar>
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                <Typography sx={{ color: '#bdbdfc', fontWeight: 600, fontSize: 16, lineHeight: 1 }}>{token.name} <span style={{ color: '#a78bfa', fontWeight: 400, fontSize: 15 }}>({token.symbol})</span></Typography>
                <Typography sx={{ color: '#7c3aed', fontWeight: 400, fontSize: 13, fontFamily: 'monospace', lineHeight: 1.2 }}>{shortenCA(token.mintKey)}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Paper>
      </Popper>
    </>
  );
} 