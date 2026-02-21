import { createContext, useContext, useState, useEffect } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { loginRequest, graphConfig } from '../config/authConfig';
import { supabaseService } from '../services/supabaseService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      if (isAuthenticated && accounts.length > 0) {
        await fetchUserProfile();
      } else {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, [isAuthenticated, accounts]);

  const fetchUserProfile = async () => {
    try {
      const account = accounts[0];
      
      // Get access token
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: account,
      });

      // Fetch user profile from Microsoft Graph
      const graphResponse = await fetch(graphConfig.graphMeEndpoint, {
        headers: {
          Authorization: `Bearer ${response.accessToken}`,
        },
      });

      if (graphResponse.ok) {
        const userData = await graphResponse.json();
        
        // Helper function to parse and clean email from EntraID guest format
        const parseEmail = (mail, userPrincipalName) => {
          // First try to use the mail property if available
          if (mail && !mail.includes('#EXT#')) {
            return mail;
          }
          
          // If userPrincipalName contains #EXT# (guest user format)
          // Example: abc_live.com#EXT#@tenant.onmicrosoft.com
          // We need to extract: abc@live.com
          if (userPrincipalName && userPrincipalName.includes('#EXT#')) {
            const beforeExt = userPrincipalName.split('#EXT#')[0];
            // Replace underscores with @ to get original email
            // abc_live.com becomes abc@live.com
            const cleanEmail = beforeExt.replace(/_/g, '@');
            return cleanEmail;
          }
          
          // Fallback to whatever is available
          return mail || userPrincipalName;
        };
        
        const cleanEmail = parseEmail(userData.mail, userData.userPrincipalName);
        
        const userProfile = {
          id: userData.id,
          name: userData.displayName,
          email: cleanEmail,
          jobTitle: userData.jobTitle,
          project: null, // Project will be set by admin in user management
          ...userData,
        };
        
        setUser(userProfile);
        
        // Create/update user in Supabase
        try {
          await supabaseService.upsertUser({
            id: userData.id,
            email: cleanEmail,
            name: userData.displayName,
            project: null
          });
        } catch (error) {
        }
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    // Check if an interaction is already in progress
    if (inProgress !== InteractionStatus.None) {
      return;
    }

    try {
      // Use redirect instead of popup for better reliability
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      // Handle specific MSAL errors
      if (error.errorCode === 'interaction_in_progress') {
        return;
      }
      throw error;
    }
  };

  const loginRedirect = async () => {
    try {
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await instance.logoutPopup();
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  const logoutRedirect = async () => {
    try {
      await instance.logoutRedirect();
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  const getAccessToken = async () => {
    try {
      const account = accounts[0];
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: account,
      });
      return response.accessToken;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    loginRedirect,
    logout,
    logoutRedirect,
    getAccessToken,
    inProgress: inProgress !== InteractionStatus.None,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
