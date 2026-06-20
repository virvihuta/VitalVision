export type UserRole = "radiologist" | "department_doctor" | "ops";
export type Modality = "X-Ray" | "CT" | "MRI" | "Ultrasound";
export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type Language = "sq" | "en";

export interface BoundingBox {
  x: number; // 0–1 normalized
  y: number; // 0–1 normalized
  w: number; // 0–1 normalized
  h: number; // 0–1 normalized
}

export interface Finding {
  region: string;
  description: string;
  severity: "normal" | "mild" | "moderate" | "severe";
  bbox?: BoundingBox;
}

export interface DiagnosticReport {
  id: string;
  patientId: string;
  patientName: string;
  personalNumber: string;
  patientAge: number;
  sex?: string;
  modality: Modality;
  bodyPart: string;
  imageDataUrl: string;
  riskScore: number;
  riskLevel: RiskLevel;
  findings: Finding[];
  impression: string;
  recommendation: string;
  archivedAt: string;
  radiologistName: string;
  department: string[];
  status: "pending" | "analyzed" | "archived";
}

export interface Alert {
  id: string;
  reportId: string;
  patientName: string;
  riskScore: number;
  riskLevel: RiskLevel;
  modality: Modality;
  targetDepartments: string[];
  createdAt: string;
  read: boolean;
}

export interface AnalysisState {
  status: "idle" | "uploading" | "analyzing" | "done" | "error";
  progress: number;
  error?: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hospital: string;
}