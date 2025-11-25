Campaign Manager — Complete Implementation Plan

OVERVIEW
A plain-text implementation plan for building a web-based Campaign Manager application. This document describes structure, data models, API endpoints, frontend pages, user roles, permissions, campaign lifecycle, feature flows (including the "Campaign Creator can add Campaign Manager with limited access" requirement), privacy controls, deployment on Replit, and a checklist to generate the full web app.

GOALS
- Provide a clear, implementable structure for backend + frontend.
- Support roles: Super Admin, Admin, Campaign Creator, Campaign Manager (limited), Respondent, Guest.
- Allow campaign creation, respondent collection, analytics, export, and fine-grained access control to respondent data.
- Make it easy to deploy on Replit (Node/Express + React recommended).

HIGH-LEVEL ARCHITECTURE
- Frontend: React (Create React App or Vite) or Next.js (recommended if SSR/SEO needed).
  - Pages/components directory structure described later.
- Backend: Node.js + Express (or NestJS if preferred) with RESTful API. Authentication via JWT sessions (refresh token optional).
- Database: PostgreSQL (recommended) or MySQL. Use an ORM (Prisma or Sequelize) for speed.
- File storage: S3-compatible (DigitalOcean Spaces, AWS S3) or store small files in DB if needed.
- Realtime: Optional — use WebSockets (Socket.IO) for live campaign progress dashboards.
- Deployment: Replit can host both frontend and backend (monorepo), or deploy backend separately (Heroku/Render/Cloud Run) and frontend to Vercel.

USER ROLES & PERMISSIONS
- Super Admin
  - Full access to everything, manage admins and global settings.
- Admin
  - Create/edit/delete campaigns, manage Campaign Creators, view exports, manage global templates.
- Campaign Creator
  - Create campaigns, add Campaign Managers (limited access), view campaign results (subject to respondent privacy settings), edit own campaigns.
- Campaign Manager (limited)
  - Access assigned campaigns only.
  - Two modes when added by Campaign Creator:
    - View results only (aggregate results, charts). Cannot see respondent-level details.
    - View results + manage campaign data (edit campaign fields, questions) but still *not* automatically allowed to view respondent identifiable details unless toggled by Super Admin/Admin.
  - Admin/Super Admin can set default when creating managers whether to allow respondent-level details.
- Respondent
  - Complete surveys, optionally provide contact info (if allowed), view confirmation pages.
- Guest
  - View limited public campaigns (if a campaign is set to public) and respond.

PERMISSION RULES (KEY)
- By default respondents' personally identifiable data (name, email, phone) are NOT visible to Campaign Managers unless explicitly granted by Admin or Super Admin.
- Admin/Super Admin can toggle per-campaign setting: "Allow manager to view respondent details" (default: OFF).
- Campaign Creator can invite managers and select one of roles: "View results only", "Edit campaign data", or a custom role. But respondent details remain hidden by default.
- Audit logs: all accesses to respondent-level data are logged with user, timestamp, action.

DATA MODELS (TABLES)
- users
  - id (uuid), name, email, password_hash, role, created_at, updated_at, active(boolean)
- organizations (optional)
  - id, name, settings, owner_id
- campaigns
  - id, title, description, creator_id, organization_id, status(draft/published/closed), visibility(public/private), allow_manager_view_respondent_details (bool), created_at, updated_at
- campaign_managers
  - id, campaign_id, user_id, permissions(json or enum: [view_results, edit_campaign, manage_respondents]), invited_by, accepted_at
- survey_forms (or campaign_forms)
  - id, campaign_id, structure(json - questions and their type & validations), version, created_at
- respondents
  - id, campaign_id, respondent_token, submitted_at, metadata(json: ip, user_agent), identifiable_fields(json optional if respondent provided contact), anonymous(boolean)
- responses
  - id, respondent_id, question_id, answer(json/text), created_at
- questions
  - id, campaign_id, question_text, type, opts(json for choices), required, order
- exports
  - id, campaign_id, file_path, generated_by, created_at
- audit_logs
  - id, user_id, action, target_type, target_id, details(json), created_at

CAMPAIGN LIFECYCLE & FLOWS
1. Draft
  - Campaign Creator builds campaign: title, description, questions, respondent settings (anonymous or collect contact info), visibility, schedule.
  - Creator can save multiple versions; form structure stored as versioned JSON.
2. Invite Managers
  - Creator goes to "Team/Managers" on campaign page -> add user by email (existing user or invite flow)
  - Select permission set (view_results, edit_campaign, manage_respondents). Default: view_results only.
  - Option toggle (only visible to Admin/Super Admin) for whether managers can view respondent identifiable data; default: OFF.
3. Publish
  - Campaign Creator publishes campaign — generates shareable link and respondent tokens if required.
4. Collect Responses
  - Respondents open link, fill form, submit. If anonymous, store only respondent_token and metadata.
5. View Results
  - Users with permission can view dashboards (aggregate charts) and exports. Managers see only allowed data.
6. Close / Archive
  - Campaign can be closed or archived by Creator or Admin.

INVITING & ROLES FLOW (DETAIL)
- Invite flow
  - Creator enters email -> system checks if user exists.
    - If exists: create campaign_managers row with invited_by and send notification.
    - If not: send email invitation with sign-up link; on register, auto-link to campaign with selected permissions.\- Manager acceptance
  - Manager accepts via link in email -> account linked; if already account, acceptance records accepted_at.
- Default access behavior
  - Creator may select manager permissions but cannot override the global privacy default for respondent details. Only Admin/Super Admin can toggle that per-campaign gate.

RESPONDENT PRIVACY & DATA ACCESS
- Two-level privacy model:
  1. Per-campaign toggle: Allow manager to view respondent details (ON/OFF). Default OFF.
  2. Per-respondent consent: respondents may opt-in to share contact info when filling the form.
- When both campaign toggle is ON and respondent opted-in, Campaign Managers with permission can view respondent contact info.
- Exports: CSV/Excel exports should include only fields the exporter is allowed to see. Export actions are logged.

FRONTEND STRUCTURE (PAGES / COMPONENTS)
- Auth: Login, Register, Forgot Password, Verify Email
- Dashboard: Overview of campaigns and quick stats
- Campaign List: filters (status, owner, date range)
- Campaign Create/Edit: multi-step wizard
  - Step 1: Basic info (title, description, visibility, schedule)
  - Step 2: Questions builder (add/edit reorder question types: text, paragraph, MCQ, checkbox, rating, file upload)
  - Step 3: Respondent Settings (anonymous, collect contact info, consent text, token settings)
  - Step 4: Team & Permissions (invite managers, set roles)
  - Step 5: Review & Publish
- Campaign View (for creators/managers)
  - Tabs: Overview, Responses, Analytics (charts), Respondent List (if allowed), Exports, Settings, Audit Logs
- Public Respondent Form Page (no auth) — responsive and accessible
- Respondent Thank-you and optional follow-up (email confirmation if collected)
- Admin Pages: Manage Users, Global Settings, Templates, Audit Log

API ENDPOINTS (SUGGESTED)
- Auth
  - POST /api/auth/register
  - POST /api/auth/login
  - POST /api/auth/refresh
  - POST /api/auth/forgot-password
- Users
  - GET /api/users/me
  - PATCH /api/users/:id (admin)
- Campaigns
  - GET /api/campaigns (filter by role/organization)
  - POST /api/campaigns
  - GET /api/campaigns/:id
  - PATCH /api/campaigns/:id
  - DELETE /api/campaigns/:id
- Managers
  - POST /api/campaigns/:id/managers (invite)
  - PATCH /api/campaigns/:id/managers/:managerId (change permissions)
  - DELETE /api/campaigns/:id/managers/:managerId
- Forms & Questions
  - GET /api/campaigns/:id/form
  - POST /api/campaigns/:id/form (save versioned JSON)
  - POST /api/campaigns/:id/questions
  - PATCH /api/campaigns/:id/questions/:qid
- Responses
  - POST /api/campaigns/:id/responses
  - GET /api/campaigns/:id/responses (permissioned)
  - GET /api/campaigns/:id/responses/:rid (permission check for respondent details)
- Exports
  - POST /api/campaigns/:id/exports (generate export)
  - GET /api/exports/:id
- Audit
  - GET /api/campaigns/:id/audit-logs (admin only)

ANALYTICS & DASHBOARD
- Aggregate metrics: responses count, completion rate, average time.
- Question charts: bar chart for MCQs, distribution for ratings, word cloud for long answers (optional).
- Filters: date range, question, respondent segment.
- Live updates: WebSocket channel for real-time counts (optional).

NOTIFICATIONS
- Email templates for invites, confirmations, campaign published, export ready.
- Optional: integrate with Twilio for SMS notifications.

SECURITY & COMPLIANCE
- Use HTTPS; enforce secure cookies for auth tokens.
- Store passwords hashed (bcrypt/argon2).
- Role-based access control middleware to enforce permissions.
- Audit logs for PII access.
- GDPR-friendly features: data export & delete requests, anonymize respondents, retention policy.

TESTING
- Unit tests for API routes (Jest + Supertest).
- Integration tests for major flows: campaign creation, invite manager, publish, response collection, export.
- End-to-end tests with Playwright/Cypress (create campaign -> respond -> view results).

EXPORTS
- CSV/Excel generation endpoint; signed temporary URL for download.
- Ensure export respects permission rules and audit-logs the action.

FOLDER STRUCTURE (Suggested)
- /server
  - /src
    - /controllers, /models, /routes, /services, /middlewares, /utils
  - /tests
  - package.json
- /client
  - /src
    - /components, /pages, /hooks, /services (api client), /styles
  - package.json
- /infra
  - docker-compose.yml, Dockerfiles, deployment scripts
- README.md

REPLIT DEPLOY STEPS (BASIC)
1. Create a new Replit project (Node.js). Use a monorepo layout or separate Repls for frontend/backend.
2. Add environment variables in Replit Secrets (JWT_SECRET, DATABASE_URL, S3 keys, MAILER credentials).
3. Install dependencies: express, prisma/sequelize, pg, cors, bcrypt, jsonwebtoken, multer (file uploads), nodemailer.
4. Setup start script to run both client and server (concurrently) or use Next.js to serve frontend from server.
5. Initialize DB (Prisma migrate or SQL scripts). Seed an initial Super Admin user using an env-only seed script.
6. Set Replit ports (process.env.PORT) and ensure the server serves the frontend build when in production.

IMPLEMENTATION TIMELINES & MILESTONES (Suggested small sprints)
- Sprint 1: Auth, User model, basic campaign create/edit, DB schema
- Sprint 2: Questions builder, form saving/versioning, publish and public respondent form
- Sprint 3: Responses collection, basic analytics, campaign list & dashboard
- Sprint 4: Managers invite flow, permissions enforcement, respondent privacy toggles, audit logs
- Sprint 5: Exports, email notifications, testing, deployment polish

CHECKLIST BEFORE SHIPPING
- [ ] Role-based middleware enforced for every endpoint
- [ ] Respondent PII gate implemented and tested
- [ ] Audit logs for PII reads/writes
- [ ] Export respects permissions
- [ ] Invite flow tested for existing and new users
- [ ] E2E tests for core flows
- [ ] Replit deployment: env vars, DB connection, start scripts, run

APPENDIX: SAMPLE CAMPAIGN JSON (minimal)
{
  "title": "Course Feedback Fall 2025",
  "visibility": "private",
  "allow_manager_view_respondent_details": false,
  "form": {
    "version": 1,
    "questions": [
      { "id": "q1", "type": "rating", "text": "Rate the instructor", "required": true },
      { "id": "q2", "type": "text", "text": "What went well?", "required": false }
    ]
  }
}


---
End of file. Follow this plan to implement the full web app in Replit. Adjust stack choices if your team prefers TypeScript/NestJS, Next.js, or other tech.

