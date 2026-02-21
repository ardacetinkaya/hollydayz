import { AppBar, Toolbar, Typography, Box, Button, Avatar, Menu, MenuItem } from '@mui/material';
import { CalendarToday, ExitToApp, AccountCircle, Settings as SettingsIcon, AdminPanelSettings, PeopleAlt, Event } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSettings = () => {
    handleMenuClose();
    navigate('/settings');
  };

  const handleAdmin = () => {
    handleMenuClose();
    navigate('/admin');
  };

  const handleUsers = () => {
    handleMenuClose();
    navigate('/users');
  };

  const handleHolidays = () => {
    handleMenuClose();
    navigate('/holidays');
  };

  const handleLogout = async () => {
    handleMenuClose();
    try {
      await logout();
    } catch (error) {
    }
  };

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh', 
      backgroundColor: 'background.default',
      width: '100%'
    }}>
      <AppBar position="static" elevation={0} sx={{ backgroundColor: 'primary.main' }}>
        <Box sx={{ 
          maxWidth: { xs: '100%', sm: '100%', md: '1400px', lg: '1600px', xl: '1800px' },
          mx: 'auto',
          width: '100%'
        }}>
          <Toolbar>
            <CalendarToday sx={{ mr: 2, color: 'white' }} />
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                flexGrow: 1, 
                color: 'white',
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8
                }
              }}
              onClick={() => navigate('/')}
            >
              HollyDayz
            </Typography>
            
            {user && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' }, color: 'white' }}>
                    {user.name}
                  </Typography>
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: 'secondary.main',
                      cursor: 'pointer'
                    }}
                    onClick={handleMenuOpen}
                  >
                    {user.name?.charAt(0)}
                  </Avatar>
                </Box>
                
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem disabled>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {user.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem onClick={handleAdmin}>
                    <AdminPanelSettings sx={{ mr: 1 }} fontSize="small" />
                    Manage Time-Offs
                  </MenuItem>
                  <MenuItem onClick={handleUsers}>
                    <PeopleAlt sx={{ mr: 1 }} fontSize="small" />
                    Manage Users
                  </MenuItem>
                  <MenuItem onClick={handleHolidays}>
                    <Event sx={{ mr: 1 }} fontSize="small" />
                    Manage Holidays
                  </MenuItem>
                  <MenuItem onClick={handleSettings}>
                    <SettingsIcon sx={{ mr: 1 }} fontSize="small" />
                    Settings
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <ExitToApp sx={{ mr: 1 }} fontSize="small" />
                    Logout
                  </MenuItem>
                </Menu>
              </>
            )}
          </Toolbar>
        </Box>
      </AppBar>
      
      <Box sx={{ 
        width: '100%',
        maxWidth: { xs: '100%', sm: '100%', md: '1400px', lg: '1600px', xl: '1800px' },
        mx: 'auto',
        px: { xs: 2, sm: 3, md: 4, lg: 5 },
        py: 4,
        flex: 1
      }}>
        {children}
      </Box>
    </Box>
  );
}

export default Layout;