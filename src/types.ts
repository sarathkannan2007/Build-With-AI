export type UrgencyType = 'Low' | 'Medium' | 'High' | 'Critical';
export type StatusType = 'Submitted' | 'Verified' | 'In Progress' | 'Resolved';

export interface Citizen {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  address: string;
  ward: string;
  district: string;
  state: string;
  language: string;
  points: number;
  badges: string[];
  trustScore: number; // 0 to 100
  role: 'Citizen' | 'Officer' | 'Admin' | 'MP';
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'Citizen' | 'Officer' | 'Admin' | 'MP';
  text: string;
  createdAt: string;
  evidenceUrl?: string;
}

export interface TimelineEvent {
  status: StatusType;
  label: string;
  date: string;
  comment?: string;
  actor?: string;
}

export interface AIAnalysis {
  summary: string;
  correctedGrammar: string;
  englishTranslation: string;
  localTranslation: string;
  officialLetter: string;
  predictedCategory: string;
  predictedDepartment: string;
  predictedUrgency: UrgencyType;
  estimatedSeverity: number; // 1 to 10
  suggestedSolution: string;
  isDuplicate: boolean;
  duplicateConfidence: number;
  isFake: boolean;
  fakeExplanation?: string;
  keywords: string[];
  confidenceScore: number; // 0 to 100
  estimatedBudget: number; // INR
  requiredManpower: number;
  completionDays: number;
  visionLabels: string[];
}

export interface OfficialReply {
  date: string;
  officerName: string;
  officerRole: string;
  message: string;
  budgetApproved?: number;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  originalDescription: string;
  category: string;
  department: string;
  urgency: UrgencyType;
  severity: number;
  imageUrl?: string;
  voiceUrl?: string;
  voiceTranscript?: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    ward: string;
    district?: string;
  };
  createdAt: string;
  expectedCompletion: string;
  status: StatusType;
  citizenId: string;
  citizenName: string;
  supportCount: number; // number of citizens verifying or merged complaints
  duplicateIds: string[];
  comments: Comment[];
  votes: { [userId: string]: 'up' | 'down' };
  timeline: TimelineEvent[];
  aiAnalysis: AIAnalysis;
  officialReply: OfficialReply | null;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  createdAt: string;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  points: number;
  badges: string[];
  trustScore: number;
  rank: number;
}

export interface Officer {
  id: string;
  name: string;
  department: string;
  district: string;
  avatar: string;
}
