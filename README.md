# Campaign Manager

A full-featured web-based Campaign Management application for creating surveys, collecting responses, and analyzing results with role-based access control.

## Features

- **User Roles & Permissions**: Super Admin, Admin, Campaign Creator, Campaign Manager, Respondent
- **Campaign Management**: Create, edit, publish, and close campaigns
- **Survey Builder**: Multiple question types (text, multiple choice, checkbox, rating, etc.)
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

### Exports
- `POST /api/campaigns/:id/exports` - Generate export
- `GET /api/campaigns/:id/exports` - List exports

## User Roles

| Role | Permissions |
|------|-------------|
| Super Admin | Full access to everything |
| Admin | Manage campaigns, users, and global settings |
| Campaign Creator | Create campaigns, invite managers |
| Campaign Manager | View/edit assigned campaigns (limited) |
| Respondent | Complete surveys |

## License

MIT
