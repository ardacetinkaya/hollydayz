---
name: spa
description: Guide for creating a React Single Page Application (SPA) with Supabase and Microsoft EntraID authentication.
---

# React SPA with Supabase & EntraID Authentication

## Overview
This skill defines the architecture and implementation patterns for building a modern Single Page Application (SPA) using React, Vite, Supabase, and Microsoft EntraID (Azure AD) authentication.

## Tech Stack
- **Frontend**: React 18+ with JavaScript (not TypeScript)
- **Build Tool**: Vite
- **UI Framework**: Material-UI (MUI) v5+
- **Routing**: React Router v6+
- **Authentication**: Microsoft EntraID (Azure AD) via MSAL
- **Backend/Database**: Supabase (PostgreSQL + REST API)
- **Date Handling**: date-fns
- **State Management**: React Context API

---

## Project Structure

```
project-root/
├── docs/                          # Documentation and SQL migrations
│   ├── complete_setup.sql         # Database schema with RLS policies for setup the application
│   ├── teardown.sql               # To drop all tables and functions (for clean slate)
│   ├── seed_data.sql              # Optional sample data for testing and demo
│   └── *.md                       # Required documentation files when needed (e.g., DATABASE_SETUP.md)
├── public/                        # Static assets
├── src/
│   ├── components/                # Reusable UI components
│   │   ├── Auth/
│   │   │   └── ProtectedRoute.jsx # Route protection wrapper
│   │   ├── Layout/
│   │   │   └── Layout.jsx         # Main app layout with navigation
│   │   └── [Feature]/             # Feature-specific components
│   ├── config/                    # Configuration files
│   │   ├── authConfig.js          # MSAL EntraID configuration
│   │   └── supabaseClient.js      # Supabase client initialization
│   ├── contexts/                  # React Context providers
│   │   └── AuthContext.jsx        # Authentication context
│   ├── pages/                     # Page-level components
│   │   ├── Login.jsx              # Login page
│   │   └── [PageName].jsx         # Other pages
│   ├── services/                  # Business logic and API calls
│   │   └── supabaseService.js     # Supabase data operations
│   ├── styles/                    # Styling and theming
│   │   └── theme.js               # MUI theme configuration
│   ├── App.jsx                    # Root component with routing
│   └── main.jsx                   # Application entry point
├── .env                           # Environment variables (gitignored)
├── .env.example                   # Environment variable template
├── package.json                   # Dependencies
└── vite.config.js                 # Vite configuration
```

---

## Installation & Setup

### 1. Initialize Project
```bash
npm create vite@latest my-app -- --template react
cd my-app
npm install
```

### 2. Install Core Dependencies
```bash
# UI Framework
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled

# Routing
npm install react-router-dom

# Authentication (MSAL for EntraID)
npm install @azure/msal-browser @azure/msal-react

# Backend (Supabase)
npm install @supabase/supabase-js

# Date handling
npm install date-fns
```

### 3. Environment Variables
Create `.env` file in project root:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Azure/EntraID Configuration
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
VITE_AZURE_REDIRECT_URI=http://localhost:5173
```

---

## Core Implementation Patterns

### 1. Supabase Client Configuration
**File**: `src/config/supabaseClient.js`
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 2. EntraID/MSAL Configuration
**File**: `src/config/authConfig.js`
```javascript
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || 'common'}`,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: () => { /* Logger disabled */ },
      logLevel: 'Error',
    },
    allowNativeBroker: false,
  },
};

export const loginRequest = {
  scopes: ['User.Read', 'profile', 'email', 'openid'],
};

export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
  graphMePhotoEndpoint: 'https://graph.microsoft.com/v1.0/me/photo/$value',
};
```

### 3. Authentication Context
**File**: `src/contexts/AuthContext.jsx`

Provides authentication state and methods throughout the app:
- `user`: Current user object from EntraID + Supabase
- `isAuthenticated`: Boolean authentication status
- `loading`: Loading state during auth operations
- `login()`: Initiates EntraID login flow
- `logout()`: Logs out user

**Key Implementation Notes**:
- Uses MSAL hooks (`useMsal`, `useIsAuthenticated`)
- Syncs EntraID user to Supabase users table on login
- Fetches user profile from Microsoft Graph API
- Stores user data in React state

### 4. Protected Route Component
**File**: `src/components/Auth/ProtectedRoute.jsx`
```javascript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
```

### 5. Supabase Service Layer
**File**: `src/services/supabaseService.js`

Centralized database operations:
```javascript
import { supabase } from '../config/supabaseClient';

export const supabaseService = {
  // User management
  async upsertUser(userData) {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .maybeSingle();

    if (existingUser) {
      return existingUser;
    }

    // Create new user
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Add other data operations here
};
```

### 6. Material-UI Theme
**File**: `src/styles/theme.js`
```javascript
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#005470',
      light: '#0B8699',
      dark: '#042835',
    },
    secondary: {
      main: '#1ECAD3',
    },
    background: {
      default: '#F8F8F8',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#494949',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
      },
    },
  },
});
```

### 7. Main App Entry Point
**File**: `src/main.jsx`
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 8. Root App Component
**File**: `src/App.jsx`
```javascript
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './config/authConfig';
import { AuthProvider } from './contexts/AuthContext';
import { theme } from './styles/theme';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import ProtectedRoute from './components/Auth/ProtectedRoute';

const msalInstance = new PublicClientApplication(msalConfig);
await msalInstance.initialize();

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        {/* Add more routes here */}
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </MsalProvider>
  );
}

export default App;
```

### 9. Login Page
**File**: `src/pages/Login.jsx`
```javascript
import { Box, Card, CardContent, Typography, Button, CircularProgress } from '@mui/material';
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
    if (loggingIn || inProgress) return;
    setLoggingIn(true);
    try {
      await login();
    } catch (error) {
      setLoggingIn(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" sx={{ mb: 3 }}>Welcome</Typography>
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleLogin}
            disabled={loggingIn || inProgress}
          >
            {loggingIn || inProgress ? <CircularProgress size={24} /> : 'Sign in with Microsoft'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Login;
```

### 10. Layout Component
**File**: `src/components/Layout/Layout.jsx`

Provides consistent app shell with:
- Top navigation bar
- User profile dropdown
- Logout functionality
- Main content area

---

## Database Setup (Supabase)

### 1. Base Schema
```sql
-- Users table (synced from EntraID)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Allow SELECT for all users"
ON users FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Allow INSERT for new users"
ON users FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Allow UPDATE for existing users"
ON users FOR UPDATE
TO authenticated, anon
USING (
  EXISTS (SELECT 1 FROM users WHERE users.is_active = true)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.is_active = true)
);
```

### 2. RLS Policy Pattern
Since EntraID is external authentication (not Supabase Auth), `auth.uid()` will always be null.

**Solution**: Base policies on user existence in users table:
```sql
-- Example policy for any table
CREATE POLICY "Allow operation for authenticated users"
ON your_table FOR [SELECT|INSERT|UPDATE|DELETE]
TO authenticated, anon
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.is_active = true
  )
);
```

---

## Key Patterns & Best Practices

### 0. Common Patterns and Best Practices
- Use React Context for global state (auth, theme)
- Centralize API calls in service layer
- Always focus on security for SPA
- Always think about alternatives and edge cases
- Use environment variables for configuration
- Follow latest JS and React best practices

### 1. Authentication Flow
1. User visits app → ProtectedRoute checks auth
2. If not authenticated → Redirect to `/login`
3. User clicks login → MSAL redirect to Microsoft
4. After login → Return to app with token
5. Sync user to Supabase users table
6. Redirect to home page

### 2. Service Layer Pattern
- All Supabase operations in `services/` folder
- Each service method handles one specific operation
- Return data or throw errors (no console.logs)
- Centralized error handling

### 3. Context API Usage
- Use Context for global state (auth, theme, etc.)
- Avoid prop drilling
- Keep contexts focused and single-purpose

### 4. Component Organization
- **Pages**: Full page components in `src/pages/`
- **Components**: Reusable UI components in `src/components/[Feature]/`
- **Layout**: App shell components in `src/components/Layout/`

### 5. Environment Variables
- Prefix with `VITE_` for Vite to expose to client
- Never commit `.env` files
- Always provide `.env.example` template

### 6. Material-UI Best Practices
- Use `sx` prop for styling
- Leverage theme tokens (e.g., `color="primary.main"`)
- Responsive sizing: `{ xs: 12, sm: 6, md: 4 }`
- Use `Box`, `Stack`, `Grid` for layouts

### 7. Routing Patterns
```javascript
// Public route
<Route path="/login" element={<Login />} />

// Protected routes (wrapped)
<Route path="/*" element={
  <ProtectedRoute>
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  </ProtectedRoute>
} />
```

### 8. Error Handling
- Use try-catch in async operations
- Display user-friendly error messages with MUI Alert
- Log errors only in development
- Provide fallback UI for error states

### 9. Loading States
- Show CircularProgress during data fetching
- Disable buttons during form submission
- Use skeleton loaders for better UX

### 10. Data Fetching Pattern
```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await supabaseService.getData();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, []);
```

---

## EntraID App Registration Setup

### Required Configuration:
1. **Azure Portal** → App Registrations → New Registration
2. **Platform**: Single-page application (SPA)
3. **Redirect URIs**: `http://localhost:5173` (dev) and production URL
4. **API Permissions**:
   - Microsoft Graph → User.Read (delegated)
   - Microsoft Graph → profile (delegated)
   - Microsoft Graph → email (delegated)
   - Microsoft Graph → openid (delegated)
5. **Authentication**:
   - Enable "Access tokens" and "ID tokens"
   - NO client secret needed (public client)

---

## Common Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## Security Considerations

1. **Never store secrets in frontend code**
2. **Use RLS policies** for all Supabase tables
3. **Validate user permissions** at database level (RLS)
4. **Use HTTPS in production**
5. **Implement CSRF protection** if needed
6. **Keep dependencies updated**
7. **Review Supabase RLS policies** regularly
8. **Sanitize user inputs** before database operations

---

## Deployment Checklist

- [ ] Update environment variables for production
- [ ] Configure production redirect URIs in Azure
- [ ] Set up Supabase production database
- [ ] Review and test all RLS policies
- [ ] Enable HTTPS
- [ ] Configure CORS if needed
- [ ] Test authentication flow end-to-end
- [ ] Set up error logging/monitoring
- [ ] Create backup strategy for database
- [ ] Document deployment process

---

## Additional Resources

- **Vite**: https://vitejs.dev/
- **React Router**: https://reactrouter.com/
- **Material-UI**: https://mui.com/
- **MSAL.js**: https://github.com/AzureAD/microsoft-authentication-library-for-js
- **Supabase**: https://supabase.com/docs
- **date-fns**: https://date-fns.org/

---

## Example Project Initialization

```bash
# Create new project
npm create vite@latest my-spa -- --template react
cd my-spa

# Install dependencies
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install react-router-dom
npm install @azure/msal-browser @azure/msal-react
npm install @supabase/supabase-js
npm install date-fns

# Create folder structure
mkdir -p src/{components/{Auth,Layout},config,contexts,pages,services,styles}
mkdir docs

# Create env file
cp .env.example .env

# Start development
npm run dev
```

This architecture provides a solid, production-ready foundation for building modern SPAs with enterprise-grade authentication and real-time database capabilities.
