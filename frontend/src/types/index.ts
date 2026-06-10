export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  RH = 'RH',
  ADMIN = 'ADMIN',
}

export enum RequestStatus {
  BROUILLON = 'BROUILLON',
  EN_ATTENTE_MANAGER = 'EN_ATTENTE_MANAGER',
  REFUSEE_MANAGER = 'REFUSEE_MANAGER',
  EN_ATTENTE_RH = 'EN_ATTENTE_RH',
  REFUSEE_RH = 'REFUSEE_RH',
  APPROUVEE = 'APPROUVEE',
  ANNULEE = 'ANNULEE',
}

export enum RequestType {
  CATALOGUE = 'CATALOGUE',
  NOUVELLE = 'NOUVELLE',
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  managerId?: string;
}

export interface Formation {
  id: string;
  name: string;
  domain: string;
  description?: string;
  estimatedCost?: number;
  isActive: boolean;
}

export interface TrainingRequest {
  id: string;
  requestType: RequestType;
  requestScope: 'INDIVIDUAL' | 'TEAM';
  createdBy: string;
  createdByUser?: User;
  formationId?: string;
  formation?: Formation;
  customFormationName?: string;
  domain?: string;
  desiredStartDate: string;
  desiredEndDate?: string;
  justification?: string;
  status: RequestStatus;
  participants?: Participant[];
  decisions?: Decision[];
  createdAt: string;
}

export interface Participant {
  id: string;
  userId: string;
  user?: User;
  participantStatus: string;
}

export interface Decision {
  id: string;
  decidedBy: string;
  decidedByUser?: User;
  decisionRole: string;
  decision: string;
  comment?: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface ChatResponse {
  intent: string;
  data: any;
  message: string;
}

export interface Comment {
  id: string;
  requestId: string;
  authorId: string;
  author?: User;
  content: string;
  createdAt: string;
}

export interface AnalyticsDashboard {
  topFormations: { formationId: string; formationName: string; domain: string; count: string }[];
  budgetByDomain: { domain: string; totalBudget: string; requestCount: string }[];
  approvalRate: number;
  avgProcessingDays: number;
  statusDistribution: { status: string; count: string }[];
  totalEnvelope: number;
  engagedBudget: number;
  monthlyRequests: { month: string; count: string }[];
}
