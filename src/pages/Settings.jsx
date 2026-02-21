import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { Save, Settings as SettingsIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { supabaseService } from '../services/supabaseService';
import { isUserAdmin, clearAdminCache } from '../utils/adminUtils';

function Settings() {
  const { user } = useAuth();
  
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (user) {
      const adminStatus = await isUserAdmin(user);
      setIsAdmin(adminStatus);
    }
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await supabaseService.getCompanySettings();
      
      // Parse JSONB values properly
      // JSONB stores strings with quotes, so "US" needs to be parsed to US
      const parsedSettings = {};
      for (const [key, value] of Object.entries(data)) {
        // If it's a string in JSONB format (with quotes), parse it
        if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
          parsedSettings[key] = value.slice(1, -1); // Remove quotes
        } else {
          parsedSettings[key] = value;
        }
      }
      
      setSettings(parsedSettings);
    } catch (err) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setSuccess(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!isAdmin) {
      setError('You do not have permission to modify settings');
      return;
    }


    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await supabaseService.updateCompanySettings(settings, user.id);
      
      // Clear admin cache if admin_emails were updated
      clearAdminCache();
      
      setSuccess(true);
      
      // Reload settings to confirm save
      await loadSettings();
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save settings: ' + (err.message || JSON.stringify(err)));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading settings...</Typography>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          You do not have permission to access this page. Only administrators can modify settings.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SettingsIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
            <Typography variant="h4" component="h1">
              Company Settings
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => window.history.back()}
            sx={{ minWidth: 100 }}
          >
            Back
          </Button>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(false)}>
            Settings saved successfully!
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Weekend Days */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.dark' }}>
              Weekend Configuration
            </Typography>
            <TextField
              fullWidth
              label="Weekend Days"
              value={settings.weekend_days ? JSON.stringify(settings.weekend_days) : '["saturday", "sunday"]'}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleChange('weekend_days', parsed);
                } catch (err) {
                  // Invalid JSON, ignore
                }
              }}
              helperText='Format: ["saturday", "sunday"]'
              disabled={saving}
            />
          </Grid>

          {/* Default Country */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.dark' }}>
              Holiday Settings
            </Typography>
            <TextField
              fullWidth
              label="Default Country"
              value={settings.default_country || 'US'}
              onChange={(e) => handleChange('default_country', e.target.value)}
              helperText="Country code for holiday calendar (e.g., US, TR, GB, SE)"
              disabled={saving}
            />
          </Grid>

          {/* Max Consecutive Days */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.dark' }}>
              Time-Off Policies
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="Maximum Consecutive Days Off"
              value={settings.max_consecutive_days || 14}
              onChange={(e) => handleChange('max_consecutive_days', parseInt(e.target.value))}
              helperText="Maximum number of consecutive days allowed for a single request"
              disabled={saving}
            />
          </Grid>

          {/* Admin Emails */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.dark' }}>
              Admin Configuration
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Admin Email Addresses"
              value={settings.admin_emails ? JSON.stringify(settings.admin_emails, null, 2) : '[]'}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleChange('admin_emails', parsed);
                } catch (err) {
                  // Invalid JSON, don't update
                }
              }}
              helperText='JSON array of admin email addresses. Example: ["admin@company.com", "manager@company.com"]'
              disabled={saving}
            />
          </Grid>

          {/* Save Button */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                onClick={handleSave}
                disabled={saving}
                size="large"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Info Box */}
        <Box sx={{ mt: 4, p: 2, backgroundColor: 'info.lighter', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            💡 <strong>Note:</strong> Changes to these settings will affect all users immediately. 
            Please be careful when modifying values.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default Settings;
