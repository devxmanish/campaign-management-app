# Environment Variables Guide

This document explains all environment variables needed to run the Campaign Management Application.

## Server Environment Variables

Create a `.env` file in the `server/` directory with the following variables:

### Database Configuration (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Supabase pooling connection string (port 6543) | `postgresql://postgres.abc123:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Supabase direct connection string (port 5432) | `postgresql://postgres.abc123:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres` |

**How to get these values:**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Database**
4. Scroll to **Connection string** section
5. Copy the **URI** format for `DATABASE_URL` (use port 6543, add `?pgbouncer=true`)
6. Copy the **URI** format for `DIRECT_URL` (use port 5432, no pgbouncer parameter)
7. Replace `[YOUR-PASSWORD]` with your actual database password

### Server Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port number | `3001` | No |
| `NODE_ENV` | Environment mode | `development` | No |

### JWT Authentication (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | `your-super-secret-jwt-key-at-least-32-characters` |
| `JWT_EXPIRES_IN` | JWT token expiration time | `7d` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (optional) | `your-refresh-token-secret` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `30d` |

**Important:** Use strong, random strings for JWT secrets in production. You can generate one using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Super Admin Configuration (Required for initial setup)

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPER_ADMIN_EMAIL` | Initial admin email address | `admin@yourcompany.com` |
| `SUPER_ADMIN_PASSWORD` | Initial admin password | `SecurePassword123!` |
| `SUPER_ADMIN_NAME` | Initial admin display name | `Super Admin` |

**Note:** These values are used when running `npm run seed` to create the first admin user.

### Frontend URL (Required for CORS)

| Variable | Description | Example |
|----------|-------------|---------|
| `FRONTEND_URL` | URL of your frontend application | `http://localhost:5173` (dev) or `https://your-app.vercel.app` (prod) |

### AI Features (Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key for AI features | `AIzaSy...your-api-key` |

**How to get a Gemini API key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

---

## Client Environment Variables

Create a `.env` file in the `client/` directory (or set these in your deployment platform):

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3001/api` (dev) or `https://your-api.onrender.com/api` (prod) |

---

## Example .env Files

### server/.env (Development)

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database - Supabase
DATABASE_URL="postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Initial Super Admin
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=AdminPassword123!
SUPER_ADMIN_NAME=Super Admin

# Frontend URL
FRONTEND_URL=http://localhost:5173

# AI - Gemini API (optional)
GEMINI_API_KEY=your-gemini-api-key
```

### server/.env (Production)

```env
# Server Configuration
PORT=10000
NODE_ENV=production

# Database - Supabase
DATABASE_URL="postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# JWT Configuration (use strong random values!)
JWT_SECRET=generate-a-strong-random-string-at-least-32-characters
JWT_EXPIRES_IN=7d

# Initial Super Admin
SUPER_ADMIN_EMAIL=admin@yourcompany.com
SUPER_ADMIN_PASSWORD=VerySecurePassword123!
SUPER_ADMIN_NAME=Admin

# Frontend URL
FRONTEND_URL=https://your-frontend.vercel.app

# AI - Gemini API
GEMINI_API_KEY=your-gemini-api-key
```

### client/.env

```env
VITE_API_URL=http://localhost:3001/api
```

---

## Deployment Environment Variables

### Render (Backend)

Set these in the Render Dashboard → Your Service → Environment:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `DATABASE_URL` | Your Supabase pooling connection string |
| `DIRECT_URL` | Your Supabase direct connection string |
| `JWT_SECRET` | Strong random string (32+ chars) |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | Your Vercel frontend URL |
| `GEMINI_API_KEY` | Your Gemini API key |
| `SUPER_ADMIN_EMAIL` | Admin email |
| `SUPER_ADMIN_PASSWORD` | Admin password |
| `SUPER_ADMIN_NAME` | Admin name |

### Vercel (Frontend)

Set these in the Vercel Dashboard → Your Project → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-api.onrender.com/api` |

---

## Troubleshooting

### Database Connection Issues

**Error: "Connection timeout"**
- Ensure you're using the correct port (6543 for pooled, 5432 for direct)
- Check that your password doesn't contain special characters that need URL encoding
- Verify your Supabase project is not paused

**Error: "Migration failed"**
- Use the SQL script (`server/supabase-setup.sql`) instead of Prisma migrations
- Run it directly in the Supabase SQL Editor

### JWT Issues

**Error: "Invalid token"**
- Ensure `JWT_SECRET` is the same on all server instances
- Check that the token hasn't expired

### CORS Issues

**Error: "CORS policy blocked"**
- Verify `FRONTEND_URL` matches your actual frontend domain
- Include the protocol (http:// or https://)
- Don't include trailing slashes
