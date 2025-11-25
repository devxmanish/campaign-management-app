# Campaign Manager

A full-featured web-based Campaign Management application for creating surveys, collecting responses, and analyzing results with role-based access control.

## Features

- **User Roles & Permissions**: Super Admin, Admin, Campaign Creator, Campaign Manager, Respondent
- **Campaign Management**: Create, edit, publish, and close campaigns
- **Survey Builder**: Multiple question types (text, multiple choice, checkbox, rating, etc.)
- **🤖 AI-Powered Question Generation**: Generate survey questions automatically using Google Gemini AI
- **Response Collection**: Public shareable links for surveys
- **Analytics Dashboard**: Response statistics and charts
- **Manager Invitations**: Invite team members with specific permissions
- **Data Privacy**: Configurable respondent data visibility
- **Export**: CSV/JSON export of responses
- **Audit Logs**: Track all data access and modifications

## Tech Stack

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL (Supabase)
- JWT Authentication
- Google Gemini AI

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- React Query
- React Router
- React Hook Form
- Zustand (State Management)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Google Gemini API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/devxmanish/campaign-management-app.git
cd campaign-management-app
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:

**Server** (`server/.env`):
```env
# Copy from server/.env.example and fill in your values
PORT=3001
NODE_ENV=development

# Supabase Database
DATABASE_URL="postgresql://postgres.[your-project-ref]:[your-password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[your-project-ref]:[your-password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Super Admin
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=SecurePassword123!
SUPER_ADMIN_NAME=Super Admin

# Frontend URL
FRONTEND_URL=http://localhost:5173

# AI - Gemini
GEMINI_API_KEY=your-gemini-api-key
```

4. Generate Prisma client and run migrations:
```bash
cd server
npx prisma generate
npx prisma migrate dev
```

5. Seed the database (creates initial admin user):
```bash
npm run seed
```

### Running the Application

Development mode (runs both server and client):
```bash
npm run dev
```

Or run separately:
```bash
# Terminal 1 - Server
cd server && npm run dev

# Terminal 2 - Client
cd client && npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

---

## 🚀 Deployment Guide

### Deploy Backend to Render

[Render](https://render.com) is recommended for deploying the Express.js backend.

#### Step 1: Create a Render Account
1. Go to [render.com](https://render.com) and sign up
2. Connect your GitHub account

#### Step 2: Create a New Web Service
1. Click **New +** → **Web Service**
2. Connect your repository
3. Configure the service:
   - **Name**: `campaign-manager-api`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `bash render-build.sh`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or paid for production)

> **Note**: The `render-build.sh` script automatically runs database migrations during the build process. This is essential for the Render free tier, which does not provide Shell access. The script includes `npm install`, `npx prisma generate`, `npx prisma migrate deploy`, and `npm run build`.

#### Step 3: Add Environment Variables
In the Render dashboard, add these environment variables:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `DATABASE_URL` | Your Supabase pooling connection string |
| `DIRECT_URL` | Your Supabase direct connection string |
| `JWT_SECRET` | A strong random string (min 32 chars) |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | Your Vercel frontend URL |
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `SUPER_ADMIN_EMAIL` | Admin email |
| `SUPER_ADMIN_PASSWORD` | Admin password |
| `SUPER_ADMIN_NAME` | Admin name |

#### Step 4: Deploy
1. Click **Create Web Service**
2. Wait for the build to complete (migrations run automatically during build)
3. (Optional) To seed the database with an initial admin user, you can:
   - Use a paid Render plan with Shell access and run: `npm run seed`
   - Or connect to your database directly and run the seed script locally

> **Important**: The `DIRECT_URL` environment variable must point to the non-pooled (direct) Supabase connection string (port 5432). Prisma migrations require a direct connection, not the pooled connection.

#### Step 5: Note Your API URL
Your API will be available at: `https://campaign-manager-api.onrender.com`

---

### Deploy Frontend to Vercel

[Vercel](https://vercel.com) is the recommended platform for the React frontend.

#### Step 1: Create a Vercel Account
1. Go to [vercel.com](https://vercel.com) and sign up
2. Connect your GitHub account

#### Step 2: Import Project
1. Click **Add New...** → **Project**
2. Import your repository
3. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### Step 3: Add Environment Variables
Add these environment variables in Vercel:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Render backend URL (e.g., `https://campaign-manager-api.onrender.com/api`) |

#### Step 4: Deploy
1. Click **Deploy**
2. Wait for the build to complete
3. Your frontend will be available at: `https://your-project.vercel.app`

#### Step 5: Update Backend CORS
Go back to Render and update the `FRONTEND_URL` environment variable to your Vercel URL.

---

### Setting Up Supabase Database

#### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up
2. Click **New Project**
3. Fill in project details and wait for setup

#### Step 2: Get Connection Strings
1. Go to **Settings** → **Database**
2. Find **Connection string** section
3. Copy both:
   - **URI** (for `DATABASE_URL`) - Use port 6543 with `?pgbouncer=true`
   - **Direct connection** (for `DIRECT_URL`) - Use port 5432

#### Step 3: Update Environment Variables
Replace `[YOUR-PASSWORD]` with your database password in both URLs.

Example:
```
DATABASE_URL="postgresql://postgres.abcdefgh:YourPassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.abcdefgh:YourPassword123@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

---

### Post-Deployment Checklist

- [ ] Backend is running on Render
- [ ] Frontend is deployed on Vercel
- [ ] Database migrations are applied
- [ ] Initial admin user is seeded
- [ ] CORS is configured correctly
- [ ] All environment variables are set
- [ ] Test login with admin credentials
- [ ] Test creating a campaign
- [ ] Test AI question generation
- [ ] Test public survey form

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id` - Get campaign
- `PATCH /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `POST /api/campaigns/:id/publish` - Publish campaign
- `POST /api/campaigns/:id/close` - Close campaign
- `GET /api/campaigns/public/:link` - Get public campaign by link

### Questions
- `POST /api/campaigns/:id/questions` - Create question
- `GET /api/campaigns/:id/questions` - List questions
- `PATCH /api/campaigns/:id/questions/:qid` - Update question
- `DELETE /api/campaigns/:id/questions/:qid` - Delete question

### Responses
- `POST /api/campaigns/:id/responses` - Submit response (public)
- `GET /api/campaigns/:id/responses` - List responses
- `GET /api/campaigns/:id/responses/:rid` - Get response

### Managers
- `POST /api/campaigns/:id/managers` - Invite manager
- `GET /api/campaigns/:id/managers` - List managers
- `PATCH /api/campaigns/:id/managers/:mid` - Update permissions
- `DELETE /api/campaigns/:id/managers/:mid` - Remove manager

### AI (Gemini)
- `POST /api/ai/generate-questions` - Generate survey questions with AI
- `POST /api/ai/generate-description` - Generate campaign description with AI

### Exports
- `POST /api/campaigns/:id/exports` - Generate export
- `GET /api/campaigns/:id/exports` - List exports

## User Roles

| Role | Permissions |
|------|-------------|
| Super Admin | Full access to everything |
| Admin | Manage campaigns, users, and global settings |
| Campaign Creator | Create campaigns, invite managers, use AI features |
| Campaign Manager | View/edit assigned campaigns (limited) |
| Respondent | Complete surveys |

## AI Features

The application uses Google Gemini AI to help create surveys:

### Generate Questions
- Enter a topic and number of questions
- AI generates relevant, well-structured survey questions
- Supports multiple question types (text, multiple choice, rating, etc.)

### Generate Description
- AI creates a professional campaign description based on the title
- Encourages participation and explains the survey purpose

## License

MIT
