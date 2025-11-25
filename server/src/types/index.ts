import { UserRole, CampaignStatus, CampaignVisibility, ManagerPermission, QuestionType } from '@prisma/client';

// Re-export Prisma enums
export { UserRole, CampaignStatus, CampaignVisibility, ManagerPermission, QuestionType };

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// User types
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
  refreshToken?: string;
}

// Campaign types
export interface CreateCampaignInput {
  title: string;
  description?: string;
  visibility?: CampaignVisibility;
  organizationId?: string;
}

export interface UpdateCampaignInput {
  title?: string;
  description?: string;
  status?: CampaignStatus;
  visibility?: CampaignVisibility;
  allowManagerViewRespondentDetails?: boolean;
  scheduledPublishAt?: Date;
}

export interface CampaignResponse {
  id: string;
  title: string;
  description: string | null;
  status: CampaignStatus;
  visibility: CampaignVisibility;
  shareableLink: string | null;
  allowManagerViewRespondentDetails: boolean;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Question types
export interface CreateQuestionInput {
  questionText: string;
  type: QuestionType;
  options?: Record<string, unknown>;
  required?: boolean;
  order?: number;
}

export interface UpdateQuestionInput {
  questionText?: string;
  type?: QuestionType;
  options?: Record<string, unknown>;
  required?: boolean;
  order?: number;
}

// Manager types
export interface InviteManagerInput {
  email: string;
  permissions: ManagerPermission[];
}

export interface UpdateManagerPermissionsInput {
  permissions: ManagerPermission[];
}

// Response types
export interface SubmitResponseInput {
  answers: {
    questionId: string;
    answer: unknown;
  }[];
  identifiableFields?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  consentGiven?: boolean;
}

// Analytics types
export interface CampaignAnalytics {
  totalResponses: number;
  completionRate: number;
  averageTimeSeconds: number;
  responsesByDay: { date: string; count: number }[];
  questionStats: {
    questionId: string;
    questionText: string;
    type: QuestionType;
    responseCount: number;
    distribution?: Record<string, number>;
  }[];
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Audit log action types
export type AuditAction = 
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'EXPORT'
  | 'PUBLISH'
  | 'CLOSE'
  | 'ARCHIVE'
  | 'INVITE_MANAGER'
  | 'REMOVE_MANAGER'
  | 'VIEW_RESPONDENT_DETAILS'
  | 'LOGIN'
  | 'LOGOUT';

export type AuditTargetType =
  | 'USER'
  | 'CAMPAIGN'
  | 'QUESTION'
  | 'RESPONSE'
  | 'RESPONDENT'
  | 'EXPORT'
  | 'MANAGER';
