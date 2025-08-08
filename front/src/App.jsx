import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Typography } from '@mui/material';
import Router from './routes';
import theme from './theme';
import Sidebar from './components/Sidebar';
import LoginScreen from './components/LoginScreen';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { TokenProvider } from './components/TokenContext';
import TokenDropdown from './components/TokenDropdown';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const auth = localStorage.getItem('isAuthenticated');
    const token = localStorage.getItem('token');
    
    if (auth === 'true' && token) {
      setIsAuthenticated(true);
    } else {
      // Clear any invalid auth data
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('authKey');
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    }
    
    // Mark loading as complete
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  // Show loading notification in bottom right
  const LoadingNotification = () => (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}
    >
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          border: '2px solid #7c3aed',
          borderTop: '2px solid transparent',
          animation: 'spin 1s linear infinite',
          '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' }
          }
        }}
      />
      <Typography variant="body2">Loading...</Typography>
    </Box>
  );

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: theme.palette.background.default
          }}
        >
          <LoadingNotification />
        </Box>
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoginScreen onLogin={handleLogin} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TokenProvider>
        <BrowserRouter>
          <Box sx={{ 
            display: 'flex', 
            height: '100vh', 
            backgroundColor: theme.palette.background.default
          }}>
            <Sidebar onLogout={handleLogout} />
            <Box sx={{ 
              flex: 1,
              minWidth: 0,
              position: 'relative'
            }}>
              <Box sx={{ position: 'absolute', top: 32, right: 40, zIndex: 10 }}>
                <TokenDropdown />
              </Box>
              <Router />
            </Box>
          </Box>
        </BrowserRouter>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </TokenProvider>
    </ThemeProvider>
  );
};

export default App; 