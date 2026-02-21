# Multi-Tenant EntraID Configuration

## Overview

By default, HollyDayz uses **single-tenant** authentication (only your organization). To allow users from **other organizations** to login, you need to configure **multi-tenant** authentication.

---

## Current vs. Multi-Tenant

| Mode | Who Can Login | Use Case |
|------|---------------|----------|
| **Single-Tenant** (current) | Only your organization | Internal company app |
| **Multi-Tenant** | Multiple specific organizations | Partner/client access |
| **Common** | Any Microsoft account | Public SaaS app |

---

## Option 1: Allow Specific Organizations (Recommended)

Best for controlled access to specific partner companies.

### Step 1: Update Azure App Registration

1. Go to [Azure Portal](https://portal.azure.com) → **App Registrations**
2. Select your HollyDayz app
3. Go to **Authentication** section
4. Under **Supported account types**, select:
   - **"Accounts in any organizational directory (Any Azure AD directory - Multitenant)"**
5. Click **Save**

### Step 2: Update Application Code

#### Option A: Allow Any Organization (Simplest)

Update `.env`:
```env
# Change from specific tenant ID to 'organizations'
VITE_AZURE_TENANT_ID=organizations
```

This allows **any** Azure AD organization to login.

#### Option B: Validate Specific Domains (More Secure)

Keep tenant ID as `organizations`, but add domain validation:

**Update `src/contexts/AuthContext.jsx`:**

```javascript
// Add after parseEmail function
const isAllowedDomain = (email) => {
  const allowedDomains = [
    'yourcompany.com',
    'partnera.com',
    'partnerb.com'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return allowedDomains.includes(domain);
};

// In fetchUserProfile function, after email parsing:
const userEmail = parseEmail(account.username);

// Add domain check
if (!isAllowedDomain(userEmail)) {
  throw new Error('Your organization is not authorized to access this application.');
}
```

### Step 3: Add Allowed Domains to Database (Optional)

Store allowed domains in `company_settings` for admin management:

```sql
-- Add allowed_domains setting
INSERT INTO public.company_settings (setting_key, setting_value, description)
VALUES ('allowed_domains', '["yourcompany.com", "partnera.com"]'::jsonb, 'Email domains allowed to access the application')
ON CONFLICT (setting_key) DO NOTHING;
```

Then update the validation to read from database:

```javascript
const isAllowedDomain = async (email) => {
  const { data, error } = await supabase
    .from('company_settings')
    .select('setting_value')
    .eq('setting_key', 'allowed_domains')
    .single();

  if (error) return false;

  const allowedDomains = data?.setting_value || [];
  const domain = email.split('@')[1]?.toLowerCase();
  
  return allowedDomains.includes(domain);
};
```

---

## Option 2: Allow Any Microsoft Account (Public App)

⚠️ **Not recommended** unless you're building a public SaaS product.

### Update `.env`:
```env
VITE_AZURE_TENANT_ID=common
```

This allows:
- Any Azure AD organization
- Personal Microsoft accounts (@outlook.com, @hotmail.com, etc.)

---

## Guest Users (B2B Collaboration)

If you want to keep **single-tenant** but allow specific external users:

### Azure Portal Setup

1. Go to **Azure Active Directory** → **Users**
2. Click **New guest user** → **Invite user**
3. Enter external user's email (e.g., `partner@partnera.com`)
4. Set **Personal message** explaining the invitation
5. Click **Invite**

### What Happens
- User receives invitation email
- They accept and are added as "Guest" in your tenant
- Guest format: `partner_partnera.com#EXT#@yourtenant.onmicrosoft.com`
- HollyDayz already handles this format (parseEmail function)

### Pros/Cons

**Pros:**
- ✅ Tight control (manual invitation)
- ✅ No code changes needed
- ✅ Guests appear in your Azure AD

**Cons:**
- ❌ Manual invitation per user
- ❌ Less scalable for many partners
- ❌ Confusing email format for guests

---

## Implementation Example: Domain Validation

Complete implementation for domain-based access control:

### 1. Add Environment Variable (Optional)

`.env`:
```env
VITE_ALLOWED_DOMAINS=yourcompany.com,partnera.com,partnerb.com
```

### 2. Update `src/utils/domainUtils.js` (Create New File)

```javascript
import { supabase } from '../config/supabaseClient';

let cachedDomains = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get allowed domains from database with caching
 */
export const getAllowedDomains = async () => {
  // Return cached value if valid
  if (cachedDomains && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return cachedDomains;
  }

  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('setting_key', 'allowed_domains')
      .single();

    if (error) throw error;

    cachedDomains = data?.setting_value || [];
    cacheTimestamp = Date.now();
    
    return cachedDomains;
  } catch (error) {
    // Fallback to environment variable
    const envDomains = import.meta.env.VITE_ALLOWED_DOMAINS || '';
    return envDomains.split(',').map(d => d.trim()).filter(d => d);
  }
};

/**
 * Check if email domain is allowed
 */
export const isAllowedDomain = async (email) => {
  const allowedDomains = await getAllowedDomains();
  
  if (allowedDomains.length === 0) {
    // No restrictions - allow all
    return true;
  }
  
  const domain = email.split('@')[1]?.toLowerCase();
  return allowedDomains.includes(domain);
};

/**
 * Clear cache (call after updating settings)
 */
export const clearDomainCache = () => {
  cachedDomains = null;
  cacheTimestamp = null;
};
```

### 3. Update `src/contexts/AuthContext.jsx`

```javascript
import { isAllowedDomain } from '../utils/domainUtils';

// In fetchUserProfile function, after getting userEmail:
const userEmail = parseEmail(account.username);

// Validate domain
const domainAllowed = await isAllowedDomain(userEmail);
if (!domainAllowed) {
  setError('Your organization is not authorized to access this application.');
  logout();
  return;
}

// Continue with user creation...
```

### 4. Add Domain Management to Settings Page

In `src/pages/Settings.jsx`, add a new field:

```javascript
{/* Allowed Domains */}
<Grid item xs={12}>
  <Typography variant="h6" gutterBottom sx={{ color: 'primary.dark' }}>
    Access Control
  </Typography>
  <TextField
    fullWidth
    multiline
    rows={3}
    label="Allowed Email Domains"
    value={settings.allowed_domains ? JSON.stringify(settings.allowed_domains, null, 2) : '[]'}
    onChange={(e) => {
      try {
        const parsed = JSON.parse(e.target.value);
        handleChange('allowed_domains', parsed);
      } catch (err) {
        // Invalid JSON
      }
    }}
    helperText='JSON array of allowed domains. Example: ["company.com", "partner.com"]. Leave empty to allow all domains.'
    disabled={saving}
  />
</Grid>
```

---

## Comparison Table

| Approach | Security | Maintenance | Scalability | Recommended For |
|----------|----------|-------------|-------------|-----------------|
| **Single-tenant + Guest Users** | High | Manual | Low | Few external users |
| **Multi-tenant + Domain Validation** | High | Automated | High | Multiple partner orgs |
| **Multi-tenant (no validation)** | Medium | Automated | High | Large partner ecosystem |
| **Common (any MS account)** | Low | Automated | Very High | Public SaaS |

---

## Testing Multi-Tenant Setup

### 1. Test with Different Tenant

1. Have a user from another organization try to login
2. They should see: **"Permissions requested"** consent screen
3. They must accept permissions
4. Check their email format in the app

### 2. Verify Guest Email Parsing

```javascript
// Test in browser console
const testEmail = "user_partner.com#EXT#@yourtenant.onmicrosoft.com";
console.log(parseEmail(testEmail)); // Should output: user@partner.com
```

### 3. Check Domain Validation

```javascript
// If you implemented domain validation
console.log(await isAllowedDomain('user@partnera.com')); // true/false
```

---

## Recommended Setup for HollyDayz

Based on your use case (allowing specific partner companies):

```env
# .env - Use 'organizations' for multi-tenant
VITE_AZURE_TENANT_ID=organizations
```

```sql
-- Database - Store allowed domains
INSERT INTO company_settings (setting_key, setting_value, description)
VALUES ('allowed_domains', '["yourcompany.com", "partnera.com", "partnerb.com"]'::jsonb, 
        'Email domains allowed to access the application');
```

**Result:**
- ✅ Users from yourcompany.com can login
- ✅ Users from partnera.com can login
- ✅ Users from partnerb.com can login
- ❌ Users from randomcompany.com are rejected
- ✅ Admins can add/remove domains via Settings page

---

## Troubleshooting

### "AADSTS50020: User account from identity provider does not exist"

**Solution:** Change `VITE_AZURE_TENANT_ID` to `organizations`

### "Your organization is not authorized"

**Solution:** Add the user's domain to `allowed_domains` setting

### Guest users see weird email format

**Solution:** Already handled by `parseEmail()` function in AuthContext

### Consent screen not appearing for external users

**Solution:** In Azure Portal → API Permissions → Grant admin consent

---

## Summary

**Quick Steps to Enable Multi-Tenant:**

1. Azure Portal → App Registration → Authentication → Select "Multitenant"
2. Update `.env`: `VITE_AZURE_TENANT_ID=organizations`
3. (Optional) Add domain validation for security
4. Test with external user

**Recommended:** Combine multi-tenant with domain validation for secure, scalable partner access.
