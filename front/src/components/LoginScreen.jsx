import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  styled
} from '@mui/material';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(7),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(4),
  maxWidth: 600,
  minWidth: 400,
  width: '100%',
  minHeight: 320,
  background: 'rgba(0, 0, 0, 0.8)',
  borderRadius: theme.spacing(3),
  border: '1.5px solid rgba(124, 58, 237, 0.22)',
  boxShadow: '0 8px 32px 0 rgba(31,38,135,0.25)',
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

const LoginScreen = ({ onLogin }) => {
  const [authKey, setAuthKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (authKey.trim() === '') {
      setError('Auth key required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log("here login")
      const response = await axios.post('http://localhost:5000/api/auth/validate', {
        authKey: authKey.trim()
      });

      if (response.data.valid) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('authKey', authKey.trim());
        localStorage.setItem('token', response.data.token);
        onLogin();
      } else {
        setError('Invalid auth key');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid auth key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `
          radial-gradient(ellipse at top, rgba(124, 58, 237, 0.08) 0%, rgba(0, 0, 0, 0.95) 100%),
          linear-gradient(90deg, rgba(124, 58, 237, 0.04) 1px, transparent 1px),
          linear-gradient(0deg, rgba(124, 58, 237, 0.04) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 30px 30px, 30px 30px',
        p: 3
      }}
    >
      <StyledPaper elevation={3}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#bdbdfc', fontWeight: 700, letterSpacing: 1, mb: 1 }}>
          Bundle Fun
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 17, mb: 2, textAlign: 'center' }}>
          Please enter your Auth key to access Bundle Fun.
        </Typography>
        <TextField
          fullWidth
          type="password"
          label="Enter Auth Key"
          value={authKey}
          onChange={(e) => setAuthKey(e.target.value)}
          error={!!error}
          helperText={error}
          disabled={loading}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !loading) {
              handleLogin();
            }
          }}
          sx={{
            input: { color: 'white', fontWeight: 600 },
            label: { color: '#bdbdfc' },
            background: 'rgba(0,0,0,0.8)',
            borderRadius: 2,
            mb: 2
          }}
        />
        <UnifiedButton
          fullWidth
          size="large"
          onClick={handleLogin}
          disabled={loading}
          sx={{ mt: 1, fontWeight: 600, fontSize: 18, borderRadius: 2, py: 1.5 }}
        >
          {loading ? 'Validating...' : 'Login'}
        </UnifiedButton>
      </StyledPaper>
    </Box>
  );
};

export default LoginScreen; 