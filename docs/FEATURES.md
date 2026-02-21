# HollyDayz — Feature List 🏖️

HollyDayz is a team holiday and time-off management system. It helps companies track employee vacation requests, sick leave, and personal days alongside official public holidays — all in one place.

---

## 🗓️ Calendar View

The main screen shows a **2-week rolling calendar** so you can see your team's availability at a glance.

- Starts from Monday with correct ISO week numbers
- Shows each team member's approved, pending, and rejected time-off days using colour coding
- Highlights official public holidays in red
- Weekends are marked as non-working days by default

---

## 📝 Time-Off Requests

Employees can submit time-off requests directly from the calendar.

- Request **vacation**, **sick leave**, or **personal days**
- Pick a single day or a range of consecutive days
- Add an optional note with your request
- Track the status of your own requests (pending / approved / rejected)

---

## ✅ Admin Approval Workflow

Admins receive all incoming requests and can act on them from a dedicated dashboard.

- View all pending time-off requests in one list
- **Approve** or **reject** each request
- Add a note when approving or rejecting (e.g. "Overlaps with project deadline")
- Approved requests instantly appear on the shared calendar

---

## 👥 User Management

Admins can manage the list of team members from the admin panel.

- Add new users and set their display name
- Assign users to one or more **projects**
- Mark users as active or inactive

---

## 🎄 Holiday Management

Admins can define the official holidays that apply to the whole company.

- Add public or company-specific holidays by date and name
- Holidays are shown per year and appear on the calendar automatically
- Edit or remove holidays as needed

---

## 📊 Admin Dashboard

A central view for admins to monitor and manage all time-off activity.

- See all requests across the company in one table
- **Filter** by user or by project to narrow down the list
- Quick approve/reject actions directly from the list

---

## ⚙️ Settings

Admins can configure company-wide preferences from the Settings page.

- Set which email addresses have admin access
- Define which days of the week are non-working (e.g. Friday–Saturday for some regions)
- Update company policies without touching the code

---

## 🔐 Authentication

HollyDayz uses **Microsoft EntraID** (formerly Azure AD) for secure sign-in.

- Employees log in with their existing company Microsoft account — no separate password needed
- Guest user accounts are also supported
- All access control is enforced at the database level, not just in the UI

---

## 🛡️ Security

- **Row-Level Security (RLS)** is enforced directly in the PostgreSQL database, so each user can only see and change data they are allowed to
- Admin privilege checks run on the server, not in the browser
- Admin email addresses are stored in the database, not hard-coded in the app

---

## 📱 Responsive Design

The application works on desktops, tablets, and mobile phones without any extra configuration.

---

## 🏗️ Tech Overview

| Area | Technology |
|------|-----------|
| Frontend | React 18 + Vite |
| UI | Material-UI (MUI) |
| Authentication | Microsoft MSAL / EntraID |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel |

For setup instructions, see the [Database Setup Guide](./DATABASE_SETUP.md) and [Deployment Guide](./VERCEL_DEPLOYMENT.md).
