// Shared TypeScript interfaces for the KSP Intelligence Dashboard

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Officer' | 'Analyst';
  rank: string;
  badgeNumber: string;
  district: string;
  station: string;
  avatar?: string;
}

export interface FIR {
  id: string;
  firNumber: string;
  crimeType: string;
  description: string;
  victimName: string;
  victimAge: number;
  victimGender: 'Male' | 'Female' | 'Other';
  suspectName: string;
  suspectAge?: number;
  officerName: string;
  officerId: string;
  district: string;
  station: string;
  status: 'Open' | 'Under Investigation' | 'Closed' | 'Pending';
  dateReported: string;
  dateOccurred: string;
  location: string;
  latitude: number;
  longitude: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  weaponUsed?: string;
  evidenceCount: number;
}

export interface Person {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  address: string;
  district: string;
  phone?: string;
  aadhaarLast4?: string;
  role: 'Suspect' | 'Victim' | 'Witness' | 'Associate';
  riskScore: number;
  linkedFIRs: string[];
  linkedPersons: string[];
  photo?: string;
  notes?: string;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  type: string;
  make: string;
  model: string;
  color: string;
  ownerId: string;
  ownerName: string;
  status: 'Clear' | 'Wanted' | 'Stolen' | 'Under Watch';
  linkedFIRs: string[];
}

export interface Evidence {
  id: string;
  firId: string;
  type: 'Image' | 'Video' | 'Audio' | 'Document' | 'Physical';
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  description: string;
  tags: string[];
  thumbnail?: string;
}

export interface Alert {
  id: string;
  type: 'Crime Spike' | 'Repeat Offender Released' | 'Vehicle Theft Alert' | 'Cyber Attack' | 'Gang Activity' | 'High Risk Zone';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  district: string;
  location: string;
  timestamp: string;
  isRead: boolean;
}

export interface Prediction {
  id: string;
  type: 'Hotspot' | 'Repeat Offender' | 'Trend' | 'Patrol';
  district: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  confidence: number;
  riskScore: number;
  description: string;
  recommendation: string;
  predictedDate: string;
  crimeType?: string;
}

export interface NetworkNode {
  id: string;
  label: string;
  type: 'Person' | 'Vehicle' | 'Phone' | 'Weapon' | 'Location' | 'Case' | 'Organization';
  riskScore?: number;
  data: Record<string, any>;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  type: 'Owns' | 'Called' | 'Visited' | 'Associated' | 'Arrested' | 'Investigated' | 'Linked';
  label: string;
}

export interface KPIData {
  totalFIRs: number;
  openCases: number;
  solvedCases: number;
  todayCrimes: number;
  todayArrests: number;
  activeInvestigations: number;
  repeatOffenders: number;
  crimeRiskScore: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface Officer {
  id: string;
  name: string;
  rank: string;
  badgeNumber: string;
  district: string;
  station: string;
  role: 'Admin' | 'Officer' | 'Analyst';
  email: string;
  phone: string;
  assignedCases: number;
  closedCases: number;
  joinedDate: string;
  status: 'Active' | 'On Leave' | 'Suspended';
}

export interface Report {
  id: string;
  type: 'Daily' | 'Weekly' | 'Monthly' | 'District' | 'Officer' | 'Crime Summary' | 'Prediction';
  title: string;
  generatedAt: string;
  generatedBy: string;
  district?: string;
  dateRange: { from: string; to: string };
  data: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: { title: string; confidence: number; type: string }[];
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  targetUser?: string;
  timestamp: string;
  details: string;
  ipAddress: string;
}
