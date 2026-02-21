// MSAL Configuration for EntraID Authentication
// Note: Client Secret is NOT required for SPAs (Single Page Applications)
// SPAs use the Authorization Code Flow with PKCE (Proof Key for Code Exchange)
// which is a secure, secret-less authentication flow designed for public clients

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
      loggerCallback: () => {
        // Logger disabled
      },
      logLevel: 'Error',
    },
    allowNativeBroker: false,
  },
};

// Add scopes for the API you want to access
export const loginRequest = {
  scopes: ['User.Read', 'profile', 'email', 'openid'],
};

// Add scopes for Microsoft Graph API
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
  graphMePhotoEndpoint: 'https://graph.microsoft.com/v1.0/me/photo/$value',
};
