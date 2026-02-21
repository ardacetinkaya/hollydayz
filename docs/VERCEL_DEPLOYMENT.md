# Vercel Deployment Guide

## Prerequisites

- ✅ GitHub/GitLab/Bitbucket account with HollyDayz repository
- ✅ [Vercel account](https://vercel.com) (free tier is fine)
- ✅ Supabase project already set up
- ✅ Azure EntraID app registration

---

## Step 1: Prepare Your Repository

### 1.1 Ensure Files Exist

Check these files are in your repository:
- ✅ `vercel.json` (already created)
- ✅ `package.json`
- ✅ `vite.config.js`
- ✅ `.env.example` (as template)

### 1.2 Add `.vercelignore` (Optional)

Create `.vercelignore` to exclude unnecessary files:
```
.env
.env.local
node_modules
.DS_Store
docs/
*.log
```

### 1.3 Commit and Push

```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

---

## Step 2: Create Vercel Project

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..." → "Project"**
3. Import your HollyDayz repository
4. Configure project:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from project root
cd /path/to/hollydayz
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - What's your project's name? hollydayz
# - In which directory is your code? ./
# - Auto-detected Vite. Override? No
```

---

## Step 3: Configure Environment Variables

### 3.1 In Vercel Dashboard

1. Go to your project → **Settings** → **Environment Variables**
2. Add each variable:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | All |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | All |
| `VITE_AZURE_CLIENT_ID` | Your EntraID client ID | All |
| `VITE_AZURE_TENANT_ID` | Your tenant ID or `organizations` | All |
| `VITE_AZURE_REDIRECT_URI` | `https://your-app.vercel.app` | Production |
| `VITE_AZURE_REDIRECT_URI` | `https://your-app-git-*.vercel.app` | Preview |
| `VITE_APP_NAME` | HollyDayz | All |
| `VITE_DEFAULT_COUNTRY` | SE | All |

**Important:** 
- Set **Production** for main domain
- Set **Preview** for preview deployments
- Set **Development** for local development (optional)

### 3.2 Via Vercel CLI

```bash
# Set environment variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_AZURE_CLIENT_ID production
vercel env add VITE_AZURE_TENANT_ID production
vercel env add VITE_AZURE_REDIRECT_URI production

# Pull variables for local development
vercel env pull .env.local
```

---

## Step 4: Deploy

### Automatic Deployment (Recommended)

Every `git push` to main branch triggers automatic deployment:
```bash
git push origin main
```

Vercel will:
1. ✅ Detect changes
2. ✅ Install dependencies
3. ✅ Build the project
4. ✅ Deploy to production
5. ✅ Show deployment URL

### Manual Deployment

```bash
# Production deployment
vercel --prod

# Preview deployment
vercel
```

---

## Step 5: Post-Deployment Configuration

### 5.1 Get Your Deployment URL

After deployment, note your URLs:
- **Production:** `https://hollydayz.vercel.app` (or custom domain)
- **Preview:** `https://hollydayz-git-branch-username.vercel.app`

### 5.2 Update Azure EntraID

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **App Registrations** → Your HollyDayz app
3. Go to **Authentication** → **Platform configurations** → **Single-page application**
4. Add redirect URIs:
   ```
   https://hollydayz.vercel.app
   https://hollydayz.vercel.app/
   ```
5. Click **Save**

### 5.3 Update Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add to **Site URL:**
   ```
   https://hollydayz.vercel.app
   ```
4. Add to **Redirect URLs:**
   ```
   https://hollydayz.vercel.app/**
   ```
5. Navigate to **Settings** → **API**
6. Update **Allowed origins** (if needed):
   ```
   https://hollydayz.vercel.app
   ```

### 5.4 Set Admin Emails

Connect to Supabase and update admin emails:
```sql
UPDATE company_settings 
SET setting_value = '["your-production-email@company.com"]'::jsonb 
WHERE setting_key = 'admin_emails';
```

---

## Step 6: Custom Domain (Optional)

### 6.1 Add Custom Domain in Vercel

1. Go to project → **Settings** → **Domains**
2. Click **Add**
3. Enter your domain (e.g., `hollydayz.yourcompany.com`)
4. Follow DNS configuration instructions

### 6.2 Update DNS Records

Add these records to your DNS provider:

**For subdomain (hollydayz.yourcompany.com):**
```
Type: CNAME
Name: hollydayz
Value: cname.vercel-dns.com
```

**For apex domain (yourcompany.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

### 6.3 Update EntraID and Supabase

Repeat Step 5.2 and 5.3 with your custom domain URL.

---

## Deployment Checklist

Before going live:

### Pre-Deployment
- [ ] Database setup complete (`complete_setup.sql` executed)
- [ ] Admin emails configured in database
- [ ] All environment variables set in Vercel
- [ ] `.env` added to `.gitignore`
- [ ] Code committed and pushed to repository

### During Deployment
- [ ] Vercel build succeeds (check build logs)
- [ ] No console errors in deployment
- [ ] Deployment URL accessible

### Post-Deployment
- [ ] Azure EntraID redirect URIs updated
- [ ] Supabase allowed origins updated
- [ ] Supabase Site URL updated
- [ ] Can login with EntraID
- [ ] Admin features accessible with admin email
- [ ] Calendar loads time-off data
- [ ] Test all main features

### Security Check
- [ ] RLS policies enabled in Supabase
- [ ] Admin checks working (try non-admin user)
- [ ] `service_role` key NOT in environment variables
- [ ] HTTPS enabled (automatic with Vercel)

---

## Vercel Deployment Features

### Automatic Previews

Every pull request gets its own preview deployment:
- URL format: `https://hollydayz-git-[branch]-[user].vercel.app`
- Perfect for testing before merging
- Automatically cleaned up when PR is closed

### Environment Variables per Branch

```
Production  → main branch    → https://hollydayz.vercel.app
Preview     → feature branch → https://hollydayz-git-feature.vercel.app
Development → local          → http://localhost:5173
```

### Rollbacks

Easy rollback to previous deployment:
1. Go to project → **Deployments**
2. Find previous successful deployment
3. Click **•••** → **Promote to Production**

---

## Monitoring

### Build Logs

View build process:
1. Go to project → **Deployments**
2. Click on deployment
3. View **Building** logs

### Runtime Logs

View application logs:
1. Go to project → **Deployments** → Click deployment
2. View **Functions** tab (if using serverless functions)
3. For client-side errors, check browser console

### Analytics (Optional)

Enable Vercel Analytics:
1. Go to project → **Analytics**
2. Enable **Web Analytics**
3. Install package:
   ```bash
   npm install @vercel/analytics
   ```
4. Add to `src/main.jsx`:
   ```javascript
   import { inject } from '@vercel/analytics';
   inject();
   ```

---

## Troubleshooting

### Build Fails

**Error:** `Cannot find module '@vitejs/plugin-react'`
```bash
# Ensure package.json has correct dependencies
npm install --save-dev @vitejs/plugin-react
git commit -am "Fix dependencies"
git push
```

**Error:** `Environment variable not found`
```bash
# Check environment variables in Vercel dashboard
# Ensure they're set for correct environment (Production/Preview)
```

### Login Not Working

**Issue:** Redirect to wrong URL after login

**Solution:** Check Azure EntraID redirect URIs include:
- Production URL
- Preview URL pattern
- Trailing slash variant

### Database Connection Issues

**Issue:** Cannot connect to Supabase

**Solution:**
1. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Check Supabase allowed origins
3. Verify RLS policies allow access

### Admin Features Not Working

**Issue:** Admin menu not visible

**Solution:**
1. Check admin email is set in database
2. Verify `is_user_admin()` function exists
3. Clear browser cache
4. Check console for errors

---

## Performance Optimization

### Enable Edge Network

Vercel automatically uses global edge network. Verify in:
- Project → **Settings** → **Functions**
- Should show: **Edge Network: Enabled**

### Add `_headers` File (Optional)

Create `public/_headers` for caching:
```
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable
```

### Optimize Bundle Size

```bash
# Analyze bundle
npm run build
npx vite-bundle-visualizer

# Check for large dependencies
# Consider lazy loading routes if needed
```

---

## CI/CD Best Practices

### Branch Protection

Set up in GitHub:
1. **Settings** → **Branches** → **Add rule**
2. Branch name pattern: `main`
3. Enable:
   - ✅ Require status checks (Vercel deployment)
   - ✅ Require branches to be up to date

### Preview Comments

Vercel automatically comments on PRs with preview URLs:
- Test changes before merging
- Share with team for review

---

## Cost Estimation

### Vercel Free Tier Limits

- ✅ 100 GB bandwidth per month
- ✅ Unlimited personal projects
- ✅ Automatic HTTPS
- ✅ Preview deployments
- ✅ Edge network

**HollyDayz Usage (estimated):**
- ~5MB per page load
- ~20,000 page views per month on free tier
- Should be sufficient for small-medium teams

### Upgrade If Needed

- **Pro:** $20/month (more bandwidth, advanced features)
- **Enterprise:** Custom pricing (SLA, support)

---

## Useful Commands

```bash
# Link local project to Vercel
vercel link

# Pull environment variables
vercel env pull

# List deployments
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Promote preview to production
vercel promote [deployment-url]

# Remove project
vercel remove [project-name]
```

---

## Next Steps After Deployment

1. ✅ Test all features in production
2. ✅ Add team members as users in database
3. ✅ Configure company holidays via admin panel
4. ✅ Set up monitoring/alerts (if needed)
5. ✅ Share production URL with team
6. ✅ Create user documentation

---

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Supabase with Vercel](https://supabase.com/docs/guides/getting-started/tutorials/with-vercel)

---

## Summary

**Deployment in 3 Steps:**

1. **Connect:** Link GitHub repo to Vercel
2. **Configure:** Set environment variables
3. **Deploy:** Push to main branch → automatic deployment

**After Deployment:**
- Update Azure EntraID redirect URIs
- Update Supabase allowed origins
- Set admin emails in production database

Your HollyDayz app will be live at `https://your-project.vercel.app` with:
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Automatic deployments on push
- ✅ Preview deployments for PRs
- ✅ Zero downtime deployments
