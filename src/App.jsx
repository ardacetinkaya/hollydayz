import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { msalConfig } from './config/authConfig';
import { AuthProvider } from './contexts/AuthContext';
import { theme } from './styles/theme';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import HolidayManagement from './pages/HolidayManagement';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL and handle redirects
await msalInstance.initialize();

// Handle redirect promise (for redirect flows)
await msalInstance.handleRedirectPromise().then((response) => {
  if (response) {
    // Account selection logic
    if (response.account) {
      msalInstance.setActiveAccount(response.account);
    }
  }
}).catch((error) => {
});

// Set active account if available
const accounts = msalInstance.getAllAccounts();
if (accounts.length > 0) {
  msalInstance.setActiveAccount(accounts[0]);
}

// Add event callback for login success
msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload.account) {
    const account = event.payload.account;
    msalInstance.setActiveAccount(account);
  }
  if (event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) {
  }
});

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
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/users" element={<UserManagement />} />
                        <Route path="/holidays" element={<HolidayManagement />} />
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

export default App
