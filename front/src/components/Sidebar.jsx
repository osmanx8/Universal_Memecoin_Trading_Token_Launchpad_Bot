import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, List, ListItem, ListItemIcon, ListItemText, Typography, Divider, Button, IconButton, Tooltip } from '@mui/material';
import {
  Home as HomeIcon,
  AccountBalanceWallet as WalletIcon,
  Token as CoinIcon,
  Settings as SettingsIcon,
  Speed as SpeedIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import LogoutDialog from './LogoutDialog';
import RefreshIcon from '@mui/icons-material/Refresh';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import StandardDialog from './StandardDialog';
import '@fontsource/orbitron/700.css';

const MENU_ITEMS = [
  { text: 'Prepare Mint', icon: <HomeIcon />, path: '/prepare-mint' },
  { text: 'Launch', icon: <CoinIcon />, path: '/prepare-launch' },
  { text: 'Sell', icon: <WalletIcon />, path: '/wallets' },
  { text: 'Account', icon: <PersonIcon />, path: '/account' },
];

const ListItemStyled = ({ item, selected, onClick }) => (
  <ListItem
    button
    selected={selected}
    onClick={onClick}
    sx={{
      mb: 0.5,
      borderRadius: 1.5,
      transition: 'all 0.2s ease',
      '&.Mui-selected': {
        backgroundColor: 'rgba(192, 192, 192, 0.10)',
        backdropFilter: 'blur(4px)',
        '&:hover': {
          backgroundColor: 'rgba(192, 192, 192, 0.15)',
        },
      },
      '&:hover': {
        backgroundColor: 'rgba(192, 192, 192, 0.05)',
      },
    }}
  >
    <ListItemIcon 
      sx={{ 
        color: selected ? 'primary.main' : 'rgba(241, 241, 245, 0.5)',
        minWidth: 40,
      }}
    >
      {item.icon}
    </ListItemIcon>
    <ListItemText 
      primary={item.text}
      primaryTypographyProps={{ 
        sx: { 
          color: selected ? 'text.primary' : 'text.secondary',
          fontWeight: 300,
          letterSpacing: '-0.015em',
          fontSize: '0.9375rem',
        }
      }}
    />
  </ListItem>
);

function Sidebar({ onLogout, themeMode, toggleTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [useJito, setUseJito] = useState(false);
  const [usePercent, setUsePercent] = useState(true);
  const [jitoTip, setJitoTip] = useState('0.0043');

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };

  const handleLogoutConfirm = () => {
    setLogoutDialogOpen(false);
    onLogout();
  };

  return (
    <Box
      sx={{
        width: 335,
        backgroundColor: 'background.sidebar',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255, 255, 255, 0.03)',
        overflow: 'hidden',
        position: 'relative',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(192, 192, 192, 0.03)',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(192, 192, 192, 0.15)',
          borderRadius: '3px',
          '&:hover': {
            background: 'rgba(192, 192, 192, 0.25)',
          },
        },
        '::after': {
          content: '""',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '42%',
          zIndex: 0,
          background: `
            repeating-linear-gradient(to right, rgba(192,192,192,0.10) 0 1px, transparent 1px 30px),
            repeating-linear-gradient(to top, rgba(192,192,192,0.10) 0 1px, transparent 1px 30px)
          `,
          backgroundSize: '30px 30px',
          backgroundRepeat: 'repeat',
          opacity: 1,
          pointerEvents: 'none',
          transform: 'skewY(-12deg) scaleY(0.85)',
          transformOrigin: 'bottom',
          maskImage: 'linear-gradient(to top, black 60%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, black 60%, transparent 100%)',
        },
      }}
    >
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography 
          variant="h5" 
          sx={{ 
            color: 'text.primary',
            mb: 1,
            fontWeight: 300,
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontFamily: 'Orbitron, sans-serif',
            mt: 4,
            fontSize: '2.2rem',
          }}
        >
          LUNR
        </Typography>
      </Box>

      <Box sx={{ px: 2, mb: 2 }}>
        <List>
          {MENU_ITEMS.map((item) => (
            <ListItemStyled
              key={item.path}
              item={item}
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            />
          ))}
        </List>
      </Box>

      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ px: 2, mb: 2 }}>
        <List>
          {location.pathname === '/wallets' && (
            <ListItemStyled
              item={{ text: 'Settings', icon: <SettingsIcon />, path: '/sell-settings' }}
              selected={false}
              onClick={() => setSettingsOpen(true)}
            />
          )}
        </List>
      </Box>

      <Box sx={{ px: 2, mb: 2 }}>
        <List>
          <ListItemStyled
            item={{ text: 'Logout', icon: <LogoutIcon />, path: '/logout' }}
            selected={false}
            onClick={handleLogoutClick}
          />
        </List>
      </Box>

      <LogoutDialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)} onConfirm={handleLogoutConfirm} />
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
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#a78bfa' },
                '& .MuiSwitch-track': { background: '#a78bfa' }
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
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#a78bfa' },
                '& .MuiSwitch-track': { background: '#a78bfa' }
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
              background: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: 2, 
              px: 2, 
              py: 0.5, 
              minWidth: 80, 
              display: 'flex', 
              alignItems: 'center',
              border: '1px solid rgba(192, 192, 192, 0.2)'
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
}

export default Sidebar; 