import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#005470', 
      light: '#0B8699',
      dark: '#042835',
      50: '#e6f4f7',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#1ECAD3',
      light: '#5fd9df',
      dark: '#0B8699',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#0B8699', // Using secondary teal for success
      light: '#3da3b3',
      lighter: '#e6f7f9',
      dark: '#005470',
    },
    warning: {
      main: '#ff9800', // Material orange
      light: '#ffb74d',
      lighter: '#fff3e0',
      dark: '#f57c00',
    },
    error: {
      main: '#f44336', // Material red
      light: '#ff7961',
      dark: '#ba000d',
    },
    background: {
      default: '#F8F8F8',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#494949', 
      secondary: '#333333',
    },
    grey: {
      50: '#F8F8F8',
      100: '#D5D5D5',
      200: '#D5D5D5',
      300: '#ABABAB',
      400: '#494949',
      500: '#333333',
      900: '#042835',
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 300,
      color: '#005470',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 400,
      color: '#005470',
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 500,
      color: '#005470',
    },
    body1: {
      color: '#494949',
    },
    body2: {
      color: '#494949',
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0, 84, 112, 0.2)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 84, 112, 0.3)',
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        }
      }
    }
  }
});