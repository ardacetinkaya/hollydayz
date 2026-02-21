# HollyDayz 🏖️

A modern React-based team holiday management system with Microsoft EntraID authentication and Supabase backend.

## Features

✨ **2-Week Calendar View** - See team availability at a glance  
🔐 **EntraID Authentication** - Secure Microsoft single sign-on  
🗓️ **Holiday Management** - Admin interface for public holidays  
👥 **Time-Off Requests** - Submit, track, and approve vacation days  
📊 **Admin Dashboard** - Manage users, holidays, and approvals  
🎨 **Clean UI** - SwedQ-inspired color palette  
📱 **Responsive Design** - Works on all devices  

## Tech Stack

- **Frontend**: React 18 + Vite
- **UI**: Material-UI with custom theme
- **Authentication**: Microsoft MSAL (EntraID)
- **Database**: Supabase (PostgreSQL)
- **Date Handling**: date-fns
- **Routing**: React Router v6

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Update `.env` with your credentials:
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Azure EntraID
VITE_AZURE_CLIENT_ID=your_client_id
VITE_AZURE_TENANT_ID=your_tenant_id
VITE_AZURE_REDIRECT_URI=http://localhost:5173
```

### 3. Set Up Database
Run SQL scripts in Supabase SQL Editor:
```sql
-- Step 1: Create schema (fresh install)
Run: docs/complete_setup.sql

-- Step 2: Add test data (optional)
Run: docs/seed_data.sql

-- Step 3: Configure admin emails
UPDATE company_settings 
SET setting_value = '["your-email@company.com"]'::jsonb 
WHERE setting_key = 'admin_emails';
```

See [Database Setup Guide](./docs/DATABASE_SETUP.md) for details.

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5173`

## Project Structure

```
hollydayz/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Calendar/       # Calendar view components
│   │   └── Layout/         # Header, navigation
│   ├── pages/              # Route pages
│   │   ├── Dashboard.jsx   # Main calendar view
│   │   ├── AdminDashboard.jsx  # Time-off management
│   │   ├── UserManagement.jsx  # User CRUD
│   │   ├── HolidayManagement.jsx  # Holiday CRUD
│   │   └── Settings.jsx    # Company settings
│   ├── contexts/           # React contexts (Auth)
│   ├── services/           # API services (Supabase)
│   ├── utils/              # Utilities (adminUtils)
│   └── styles/             # Theme configuration
├── docs/
│   ├── complete_setup.sql  # Database schema + RLS
│   ├── seed_data.sql       # Test data
│   ├── teardown.sql        # Database cleanup
│   ├── DATABASE_SETUP.md   # Setup instructions
│   └── SUPABASE_SECURITY.md  # Security guide
└── public/                 # Static assets
```

## Documentation

- 📘 **[Database Setup Guide](./docs/DATABASE_SETUP.md)** - Complete database installation
- 🔐 **[Security Guide](./docs/SUPABASE_SECURITY.md)** - Understanding Supabase security model


## Key Features

### Calendar View
- 2-week view starting from Monday
- Week numbers according to year
- Color-coded time-off status (approved, pending, rejected)
- Official holidays marked in red
- Weekends disabled by default

### Time-Off Management
- Request vacation, sick leave, personal days
- Submit single or multiple consecutive days
- View all team members' time-off
- Admin approval workflow

### Admin Features
- **User Management**: Add/edit users and assign projects
- **Holiday Management**: Define official holidays per year
- **Time-Off Approvals**: Approve/reject requests with notes
- **Filters**: View time-off by user or project
- **Settings**: Configure admin emails, weekend days, policies

### Security
- Row Level Security (RLS) enforced at database level
- Admin checks run server-side via `is_user_admin()` function
- Admin emails stored in database (not client code)
- EntraID guest user email parsing

See [SUPABASE_SECURITY.md](./docs/SUPABASE_SECURITY.md) for security model details.

## Configuration

### Admin Access
Admin access is controlled via email addresses in the database:

```sql
-- Via Supabase SQL Editor
UPDATE company_settings 
SET setting_value = '["admin1@company.com", "admin2@company.com"]'::jsonb 
WHERE setting_key = 'admin_emails';
```

Or update via Settings page (requires existing admin access).

### EntraID Setup
1. Register app in [Azure Portal](https://portal.azure.com)
2. Set redirect URI: `http://localhost:5173` (dev) or your domain (prod)
3. Add API permissions: `User.Read`
4. Update environment variables

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Deployment Checklist

- [ ] Update `.env` with production values
- [ ] Set admin emails in database
- [ ] Configure EntraID redirect URIs for production domain
- [ ] Update Supabase allowed origins
- [ ] Run `npm run build`
- [ ] Test authentication flow
- [ ] Verify RLS policies are enabled

## Troubleshooting

### 500 Errors on Database Queries
- Check RLS is properly configured
- See [Database Setup Guide](./docs/DATABASE_SETUP.md#troubleshooting)

### Admin Features Not Visible
- Verify your email is in admin_emails setting
- Check `is_user_admin()` function exists
- Clear browser cache

### EntraID Guest User Email Issues
- App automatically parses guest email format
- Format: `user_domain.com#EXT#@tenant` → `user@domain.com`

## License

MIT License

