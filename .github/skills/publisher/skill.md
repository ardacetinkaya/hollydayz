---
name: publisher
description: Use for deploying the **HollyDayz** React application to Vercel using Vercel CLI.
---

# Publisher Skill - HollyDayz Vercel Deployment

A deployment skill for the **HollyDayz** project. The skill is responsible for deploying this specific React application to Vercel using Vercel CLI in a reliable and secure manner. 

## Project Context

**Project:** HollyDayz - Holiday Management Application
**Framework:** React 18 + Vite
**Repository:** https://github.com/ardacetinkaya/hollydayz
**Tech Stack:** React, Material-UI, Supabase, Microsoft EntraID

## Required Environment Variables

This project requires these environment variables in Vercel:

```env
VITE_SUPABASE_URL=<Supabase project URL>
VITE_SUPABASE_ANON_KEY=<Supabase anon key>
VITE_AZURE_CLIENT_ID=<EntraID client ID>
VITE_AZURE_TENANT_ID=<Tenant ID or "organizations">
VITE_AZURE_REDIRECT_URI=<Production URL>
VITE_APP_NAME=HollyDayz
VITE_DEFAULT_COUNTRY=SE
```

## Deployment Workflow

### 1. Pre-Deployment Checks

- Ensure you are in project root directory


```bash
# Verify git status
git status

# Ensure all changes are committed
git add .
git commit -m "Deployment preparation"
git push origin main

# Test build locally
npm run build
```

### 2. Install and Authenticate Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login
```

### 3. Link Project (First Time Only)

```bash
# Link to existing Vercel project or create new
vercel link

# Answer prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No (first time) / Yes (if exists)
# - Project name? hollydayz
```

### 4. Configure Environment Variables

**Method 1: Via CLI (Recommended)**
```bash
# Add each variable for production
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_AZURE_CLIENT_ID production
vercel env add VITE_AZURE_TENANT_ID production
vercel env add VITE_AZURE_REDIRECT_URI production
vercel env add VITE_APP_NAME production
vercel env add VITE_DEFAULT_COUNTRY production

# List to verify
vercel env ls
```

**Method 2: From Local .env**
```bash
# Create .env.production with values
# Then add each variable:
cat .env.production | grep VITE_ | while IFS='=' read -r key value; do
  echo "Adding $key..."
  echo "$value" | vercel env add "$key" production
done
```

### 5. Deploy to Preview (Test First)

```bash
# Deploy to preview environment
vercel

# This will:
# - Build the project
# - Deploy to preview URL
# - Return preview URL for testing
```

**Test the preview URL:**
- Verify application loads
- Test EntraID login
- Check database connection
- Test admin features

### 6. Deploy to Production

```bash
# If preview works, deploy to production
vercel --prod

# This will:
# - Build optimized production bundle
# - Deploy to production domain
# - Return production URL
```

### 7. Post-Deployment Configuration

After successful deployment, suggest required actions for external services:

**Azure EntraID:**
1. Go to Azure Portal → App Registrations
2. Select your HollyDayz app
3. Go to Authentication
4. Add redirect URI: `https://your-app.vercel.app`

**Supabase:**
1. Go to Supabase Dashboard
2. Authentication → URL Configuration
3. Add Site URL: `https://your-app.vercel.app`
4. Add Redirect URLs: `https://your-app.vercel.app/**`
5. Settings → API → Add to allowed origins

**Database (if fresh deployment):**
```sql
-- Set production admin emails
UPDATE company_settings 
SET setting_value = '["your-production-email@company.com"]'::jsonb 
WHERE setting_key = 'admin_emails';
```

## Quick Commands

### Deploy to Preview
```bash
vercel
```

### Deploy to Production
```bash
vercel --prod
```

### Force Rebuild
```bash
vercel --prod --force
```

### Check Deployment Status
```bash
vercel ls
```

### View Logs
```bash
vercel logs [deployment-url]
```

### Rollback (if needed)
```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote [previous-deployment-url]
```

## Troubleshooting

### Build Fails - Missing Dependencies
```bash
# Ensure package.json is correct
npm install
npm run build

# If build works locally, try force rebuild
vercel --prod --force
```

### Environment Variables Not Working
```bash
# Verify variables are set
vercel env ls

# Ensure VITE_ prefix is used
# Re-add if needed:
vercel env rm VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_URL production
```

### Login Not Working After Deployment
**Issue:** Redirect URI mismatch

**Solution:**
1. Get your Vercel URL
2. Update Azure EntraID redirect URIs
3. Include both with and without trailing slash:
   - `https://your-app.vercel.app`
   - `https://your-app.vercel.app/`

### Database Connection Errors
**Issue:** Supabase RLS blocking

**Solution:**
1. Check Supabase allowed origins
2. Verify environment variables are correct
3. Ensure RLS policies allow access

## Deployment Checklist

Before deploying:
- [ ] Code committed to GitHub
- [ ] Local build succeeds (`npm run build`)
- [ ] Environment variables ready
- [ ] Vercel CLI installed
- [ ] Vercel authenticated

After deploying:
- [ ] Deployment URL accessible
- [ ] EntraID redirect URIs updated
- [ ] Supabase URLs updated
- [ ] Admin emails configured
- [ ] Login tested
- [ ] All features working

## Project-Specific Notes

- This is a Vite + React application
- Build output goes to `dist/` folder
- Uses simple and modern color theme (#005470, #1ECAD3)
- Requires EntraID authentication
- Uses Supabase for database
- Admin access controlled via database setting

## When User Asks to Deploy

1. **Verify Prerequisites:**
   - Check if Vercel CLI is installed
   - Verify project is in git
   - Ensure environment variables are documented

2. **Guide Step-by-Step:**
   - Install/authenticate CLI if needed
   - Link project (first time)
   - Configure environment variables
   - Deploy to preview first
   - Test preview
   - Deploy to production

3. **Post-Deployment:**
   - Update EntraID redirect URIs
   - Update Supabase configuration
   - Verify all features work
   - Provide production URL to user

4. **Troubleshoot if Needed:**
   - Check build logs
   - Verify environment variables
   - Test locally first
   - Provide specific solutions

Always deploy to **preview first**, test thoroughly, then deploy to **production**.
