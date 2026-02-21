import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Container,
  CircularProgress 
} from '@mui/material';
import { CalendarToday } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function Login() {
  const { login, isAuthenticated, loading, inProgress } = useAuth();
  const navigate = useNavigate();
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLogin = async () => {
    if (loggingIn || inProgress) {
      return;
    }

    setLoggingIn(true);
    try {
      await login();
      // Note: With redirect flow, this code won't execute
      // as the page will redirect to Microsoft
    } catch (error) {
      setLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #8B7ED8 0%, #A8D8EA 100%)'
        }}
      >
        <CircularProgress size={60} sx={{ color: 'white' }} />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        background: 'linear-gradient(135deg, #8B7ED8 0%, #A8D8EA 100%)'
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <CalendarToday 
              sx={{ 
                fontSize: 64, 
                color: 'primary.main', 
                mb: 2 
              }} 
            />
            
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ mb: 2, color: 'primary.dark', fontWeight: 300 }}
            >
              HollyDayz
            </Typography>
            
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ mb: 4, fontWeight: 400 }}
            >
              Team Holiday Management System
            </Typography>
            
            <Typography 
              color="text.secondary" 
              sx={{ mb: 4 }}
            >
              Plan your team's time off and stay organized with our simple, 
              elegant calendar view. Sign in with your Microsoft account to get started.
            </Typography>
            
            <Button 
              variant="contained" 
              size="large"
              onClick={handleLogin}
              disabled={loggingIn || inProgress}
              startIcon={loggingIn || inProgress ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ 
                px: 4, 
                py: 1.5, 
                fontSize: '1.1rem',
                background: 'linear-gradient(45deg, #8B7ED8 30%, #A8D8EA 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5F4BB6 30%, #7CB9D1 90%)',
                },
                '&:disabled': {
                  background: 'grey.400',
                }
              }}
            >
              {loggingIn || inProgress ? 'Signing in...' : 'Sign in with Microsoft'}
            </Button>

            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ display: 'block', mt: 3 }}
            >
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default Login;