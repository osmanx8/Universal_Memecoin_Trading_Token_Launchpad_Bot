import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Paper,
  Button,
  Typography,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Snackbar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  background: 'rgba(0, 0, 0, 0.8)',
  borderRadius: theme.spacing(3),
  border: '1.5px solid rgba(124, 58, 237, 0.22)',
  boxShadow: '0 8px 32px 0 rgba(31,38,135,0.25)',
  marginBottom: theme.spacing(3)
}));

const UnifiedButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)',
  color: 'white',
  fontWeight: 600,
  fontSize: 16,
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

const DangerButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)',
  color: 'white',
  fontWeight: 600,
  fontSize: 14,
  borderRadius: 6,
  border: 'none !important',
  outline: 'none !important',
  boxShadow: 'none !important',
  transition: 'background 0.2s',
  '&:hover, &:focus, &:active': {
    background: 'linear-gradient(90deg, #b91c1c 0%, #dc2626 100%)',
    border: 'none !important',
    outline: 'none !important',
    boxShadow: 'none !important',
  },
}));

const Admin = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newAuthKey, setNewAuthKey] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const currentAuthKey = localStorage.getItem('authKey');
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: {
          'x-admin-key': currentAuthKey
        }
      });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      setSnackbar({ open: true, message: 'Failed to fetch users - Check admin key', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      setCheckingAdmin(true);
      const currentAuthKey = localStorage.getItem('authKey');
      
      console.log('Current auth key:', currentAuthKey);
      
      if (!currentAuthKey) {
        console.log('No auth key found');
        setIsAdmin(false);
        return;
      }

      // Test if current user is admin by trying to fetch users
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: {
          'x-admin-key': currentAuthKey
        }
      });

      console.log('Admin check response:', response.status);
      
      if (response.status === 200) {
        console.log('Admin access granted');
        setIsAdmin(true);
        setUsers(response.data.users);
      } else {
        console.log('Admin access denied');
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Admin access check failed:', error);
      console.log('Error response:', error.response?.status, error.response?.data);
      setIsAdmin(false);
      navigate('/');
    } finally {
      setCheckingAdmin(false);
    }
  };

  const generateAuthKey = async () => {
    try {
      setGenerating(true);
      const currentAuthKey = localStorage.getItem('authKey');
      const response = await axios.post('http://localhost:5000/api/admin/create-auth-key', {}, {
        headers: {
          'x-admin-key': currentAuthKey
        }
      });
      setNewAuthKey(response.data.authKey);
      setSnackbar({ open: true, message: 'Auth key generated successfully!', severity: 'success' });
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error generating auth key:', error);
      setSnackbar({ open: true, message: 'Failed to generate auth key - Check admin key', severity: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const currentAuthKey = localStorage.getItem('authKey');
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
        headers: {
          'x-admin-key': currentAuthKey
        }
      });
      setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' });
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error deleting user:', error);
      
      // Show specific error message from backend
      if (error.response?.status === 403) {
        setSnackbar({ 
          open: true, 
          message: error.response.data.message || 'Admins cannot delete other admins or superadmin', 
          severity: 'error' 
        });
      } else {
        setSnackbar({ open: true, message: 'Failed to delete user - Check admin key', severity: 'error' });
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Show loading while checking admin access
  if (checkingAdmin) {
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
        }}
      >
        <Typography variant="h6" sx={{ color: 'white' }}>
          Checking admin access...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `
          radial-gradient(ellipse at top, rgba(124, 58, 237, 0.08) 0%, rgba(0, 0, 0, 0.95) 100%),
          linear-gradient(90deg, rgba(124, 58, 237, 0.04) 1px, transparent 1px),
          linear-gradient(0deg, rgba(124, 58, 237, 0.04) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 30px 30px, 30px 30px',
        p: 3
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ 
          color: '#bdbdfc', 
          fontWeight: 700, 
          letterSpacing: 1, 
          mb: 4, 
          textAlign: 'center' 
        }}>
          Admin Dashboard
        </Typography>

        {/* Generate Auth Key Section */}
        <StyledPaper>
          <Typography variant="h5" component="h2" gutterBottom sx={{ 
            color: '#bdbdfc', 
            fontWeight: 600, 
            mb: 3 
          }}>
            Generate New Auth Key
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <UnifiedButton
              onClick={generateAuthKey}
              disabled={generating}
              startIcon={<AddIcon />}
            >
              {generating ? 'Generating...' : 'Generate Auth Key'}
            </UnifiedButton>
            
            {newAuthKey && (
              <Box sx={{ 
                backgroundColor: 'rgba(124, 58, 237, 0.1)', 
                border: '1px solid rgba(124, 58, 237, 0.3)',
                borderRadius: 2,
                p: 2,
                flex: 1
              }}>
                <Typography variant="body2" sx={{ color: '#bdbdfc', fontWeight: 600, mb: 1 }}>
                  New Auth Key:
                </Typography>
                <Typography variant="h6" sx={{ 
                  color: '#7c3aed', 
                  fontWeight: 700, 
                  fontFamily: 'monospace',
                  letterSpacing: 1
                }}>
                  {newAuthKey}
                </Typography>
              </Box>
            )}
          </Box>
        </StyledPaper>

        {/* Users List Section */}
        <StyledPaper>
          <Typography variant="h5" component="h2" gutterBottom sx={{ 
            color: '#bdbdfc', 
            fontWeight: 600, 
            mb: 3 
          }}>
            Current Users ({users.length})
          </Typography>

          {loading ? (
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', py: 4 }}>
              Loading users...
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                                 <TableHead>
                   <TableRow>
                     <TableCell sx={{ color: '#bdbdfc', fontWeight: 600 }}>Auth Key</TableCell>
                     <TableCell sx={{ color: '#bdbdfc', fontWeight: 600 }}>Last Login</TableCell>
                     <TableCell sx={{ color: '#bdbdfc', fontWeight: 600 }}>Created</TableCell>
                     <TableCell sx={{ color: '#bdbdfc', fontWeight: 600 }}>Actions</TableCell>
                   </TableRow>
                 </TableHead>
                <TableBody>
                                     {users.map((user) => (
                     <TableRow key={user._id} sx={{ '&:hover': { backgroundColor: 'rgba(124, 58, 237, 0.05)' } }}>
                                                                     <TableCell sx={{ color: '#7c3aed', fontWeight: 600, fontFamily: 'monospace' }}>
                         {user.authKey}
                       </TableCell>
                       <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>
                         {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                       </TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        {new Date(user.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <DangerButton
                          size="small"
                          onClick={() => deleteUser(user._id)}
                          startIcon={<DeleteIcon />}
                        >
                          Delete
                        </DangerButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </StyledPaper>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Admin; 