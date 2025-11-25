-- =====================================================
-- Campaign Management Application - Supabase SQL Setup
-- =====================================================
-- Run this SQL script in the Supabase SQL Editor:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor (left sidebar)
-- 3. Click "New query"
-- 4. Paste this entire script
-- 5. Click "Run" to execute
-- =====================================================

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUM TYPES
-- =====================================================

-- User roles
CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN',
  'ADMIN',
  'CAMPAIGN_CREATOR',
  'CAMPAIGN_MANAGER',
  'RESPONDENT',
  'GUEST'
);

-- Campaign status
CREATE TYPE campaign_status AS ENUM (
  'DRAFT',
  'PUBLISHED',
  'CLOSED',
  'ARCHIVED'
);

-- Campaign visibility
CREATE TYPE campaign_visibility AS ENUM (
  'PUBLIC',
  'PRIVATE'
);

-- Manager permission
CREATE TYPE manager_permission AS ENUM (
  'VIEW_RESULTS',
  'EDIT_CAMPAIGN',
  'MANAGE_RESPONDENTS'
);

-- Question type
CREATE TYPE question_type AS ENUM (
  'TEXT',
  'PARAGRAPH',
  'MULTIPLE_CHOICE',
  'CHECKBOX',
  'RATING',
  'FILE_UPLOAD',
  'DATE',
  'NUMBER'
);

-- =====================================================
-- TABLES
-- =====================================================

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role DEFAULT 'RESPONDENT' NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL,
  organization_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  settings JSONB,
  owner_id UUID UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add foreign key constraint to users table (after organizations is created)
ALTER TABLE users 
  ADD CONSTRAINT fk_users_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- Add foreign key constraint to organizations table
ALTER TABLE organizations 
  ADD CONSTRAINT fk_organizations_owner 
  FOREIGN KEY (owner_id) REFERENCES users(id);

-- Campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL,
  organization_id UUID,
  status campaign_status DEFAULT 'DRAFT' NOT NULL,
  visibility campaign_visibility DEFAULT 'PRIVATE' NOT NULL,
  allow_manager_view_respondent_details BOOLEAN DEFAULT false NOT NULL,
  shareable_link VARCHAR(255) UNIQUE,
  scheduled_publish_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT fk_campaigns_creator FOREIGN KEY (creator_id) REFERENCES users(id),
  CONSTRAINT fk_campaigns_organization FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Campaign Managers table
CREATE TABLE campaign_managers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL,
  user_id UUID NOT NULL,
  permissions manager_permission[] DEFAULT '{}' NOT NULL,
  invited_by UUID NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT fk_campaign_managers_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  CONSTRAINT fk_campaign_managers_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_campaign_managers_invited_by FOREIGN KEY (invited_by) REFERENCES users(id),
  CONSTRAINT unique_campaign_user UNIQUE (campaign_id, user_id)
);

-- Survey Forms table (versioned form structure)
CREATE TABLE survey_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL,
  structure JSONB NOT NULL,
  version INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT fk_survey_forms_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  type question_type NOT NULL,
  opts JSONB,
  required BOOLEAN DEFAULT false NOT NULL,
  "order" INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT fk_questions_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- Respondents table
CREATE TABLE respondents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL,
  respondent_token VARCHAR(255) UNIQUE NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  identifiable_fields JSONB,
  anonymous BOOLEAN DEFAULT true NOT NULL,
  consent_given BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT fk_respondents_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- Responses table
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  respondent_id UUID NOT NULL,
  question_id UUID NOT NULL,
  answer JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT fk_responses_respondent FOREIGN KEY (respondent_id) REFERENCES respondents(id) ON DELETE CASCADE,
  CONSTRAINT fk_responses_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Exports table
CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  generated_by UUID NOT NULL,
  format VARCHAR(50) DEFAULT 'csv' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT fk_exports_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  CONSTRAINT fk_exports_user FOREIGN KEY (generated_by) REFERENCES users(id)
);

-- Audit Logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  action VARCHAR(255) NOT NULL,
  target_type VARCHAR(255) NOT NULL,
  target_id VARCHAR(255) NOT NULL,
  details JSONB,
  campaign_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_audit_logs_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
);

-- =====================================================
-- INDEXES (for better performance)
-- =====================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_organization ON users(organization_id);

CREATE INDEX idx_campaigns_creator ON campaigns(creator_id);
CREATE INDEX idx_campaigns_organization ON campaigns(organization_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_shareable_link ON campaigns(shareable_link);

CREATE INDEX idx_campaign_managers_campaign ON campaign_managers(campaign_id);
CREATE INDEX idx_campaign_managers_user ON campaign_managers(user_id);

CREATE INDEX idx_survey_forms_campaign ON survey_forms(campaign_id);

CREATE INDEX idx_questions_campaign ON questions(campaign_id);
CREATE INDEX idx_questions_order ON questions(campaign_id, "order");

CREATE INDEX idx_respondents_campaign ON respondents(campaign_id);
CREATE INDEX idx_respondents_token ON respondents(respondent_token);

CREATE INDEX idx_responses_respondent ON responses(respondent_id);
CREATE INDEX idx_responses_question ON responses(question_id);

CREATE INDEX idx_exports_campaign ON exports(campaign_id);
CREATE INDEX idx_exports_user ON exports(generated_by);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_campaign ON audit_logs(campaign_id);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at column
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_managers_updated_at
  BEFORE UPDATE ON campaign_managers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PRISMA MIGRATIONS TABLE (Required for Prisma compatibility)
-- =====================================================
-- This table allows Prisma to track that migrations have been applied
-- even though we created the schema manually.
-- 
-- IMPORTANT: This table schema must match Prisma's migration system requirements.
-- If you upgrade Prisma, you may need to verify this schema is still compatible.
-- See: https://www.prisma.io/docs/concepts/components/prisma-migrate

CREATE TABLE IF NOT EXISTS _prisma_migrations (
  id VARCHAR(36) PRIMARY KEY,
  checksum VARCHAR(64) NOT NULL,
  finished_at TIMESTAMP WITH TIME ZONE,
  migration_name VARCHAR(255) NOT NULL,
  logs TEXT,
  rolled_back_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  applied_steps_count INTEGER DEFAULT 0 NOT NULL
);

-- Insert a migration record so Prisma knows the schema is set up
-- Using a clear 'manual_sql_setup' prefix to distinguish from auto-generated migrations
INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, applied_steps_count)
VALUES (
  'manual-sql-setup-' || to_char(NOW(), 'YYYYMMDDHH24MISS'),
  'manual-sql-setup-supabase-editor',
  NOW(),
  'manual_sql_setup_initial_schema',
  1
);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
-- If you see this message in the output, the script ran successfully!

DO $$
BEGIN
  RAISE NOTICE 'Database setup completed successfully!';
  RAISE NOTICE 'Tables created: users, organizations, campaigns, campaign_managers, survey_forms, questions, respondents, responses, exports, audit_logs';
  RAISE NOTICE 'Next step: Run the seed script to create your initial Super Admin user';
END $$;
