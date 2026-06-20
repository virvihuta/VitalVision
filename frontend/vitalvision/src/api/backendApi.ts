import type {
  DiagnosticReport,
  Finding,
  Language,
  Modality,
  RiskLevel,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface ArchiveMetadata {
  patientName: string;
  patientId: string;
  personalNumber: string;
  patientAge: number;
  sex: string;
  modality: Modality;
  bodyPart: string;
  clinicalNotes: string;
  radiologistName: string;
  imageDataUrl: string;
}

export interface BackendStudy {
  id: string;
  timestamp: string;
  metadata: Partial<ArchiveMetadata> & { department?: string[] };
  report: {
    riskScore: number;
    riskLevel: RiskLevel;
    findings: Finding[];
    impression: string;
    recommendation: string;
    tags?: string[];
    predictedClass?: string;
    confidence?: number;
    department?: string[];
  };
}

export interface Stats {
  totalStudies: number;
  averageRiskScore: number;
  highRiskCases: number;
  modalityBreakdown: Record<string, number>;
}

function getDepartments(
  riskLevel: RiskLevel,
  modality: Modality,
  bodyPart: string
): string[] {
  if (riskLevel !== "CRITICAL" && riskLevel !== "HIGH") return [];
  const depts = ["Emergency"];
  const bp = bodyPart.toLowerCase();
  if (modality === "MRI" && bp.includes("brain")) depts.push("Neurology");
  if (modality === "X-Ray" && bp.includes("chest")) depts.push("Pulmonology");
  if (bp.includes("abdomen")) depts.push("Surgery");
  if (bp.includes("heart") || bp.includes("cardiac")) depts.push("Cardiology");
  return depts;
}

export async function analyzeImage(
  imageDataUrl: string,
  patientName: string,
  patientAge: number,
  modality: Modality,
  bodyPart: string,
  lang: Language = "en",
  personalNumber: string = "",
  sex: string = "",
  clinicalNotes: string = ""
): Promise<Partial<DiagnosticReport>> {
  const base64 = imageDataUrl.split(",")[1] ?? imageDataUrl;
  const res = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: base64,
      lang,
      metadata: {
        patientName,
        patientId: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
        personalNumber,
        age: patientAge,
        sex,
        modality,
        bodyPart,
        clinicalNotes,
      },
    }),
  });
  if (!res.ok) throw new Error(`Analyze failed: ${res.status}`);
  const data = await res.json();

  const riskLevel = (data.riskLevel ?? "LOW") as RiskLevel;
  const departments = getDepartments(riskLevel, modality, bodyPart);

  return {
    riskScore: data.riskScore ?? 0,
    riskLevel,
    findings: (data.findings ?? []) as Finding[],
    impression: data.impression ?? "",
    recommendation: data.recommendation ?? "",
    department: departments,
  };
}

export async function archiveStudy(
  metadata: Record<string, unknown>,
  report: Record<string, unknown>
): Promise<{ success: boolean; studyId: string }> {
  const res = await fetch(`${API_URL}/archive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ metadata, report }),
  });
  if (!res.ok) throw new Error(`Archive failed: ${res.status}`);
  return res.json();
}

export async function getStudies(): Promise<DiagnosticReport[]> {
  const res = await fetch(`${API_URL}/studies`);
  if (!res.ok) throw new Error(`Studies fetch failed: ${res.status}`);
  const studies: BackendStudy[] = await res.json();
  return studies.map(studyToReport);
}

export async function getAlerts(): Promise<DiagnosticReport[]> {
  const res = await fetch(`${API_URL}/alerts`);
  if (!res.ok) throw new Error(`Alerts fetch failed: ${res.status}`);
  const studies: BackendStudy[] = await res.json();
  return studies.map(studyToReport);
}

export async function getStats(): Promise<Stats> {
  const res = await fetch(`${API_URL}/stats`);
  if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
  return res.json();
}

export function studyToReport(s: BackendStudy): DiagnosticReport {
  const m = s.metadata ?? {};
  const r = s.report ?? ({} as BackendStudy["report"]);
  return {
    id: s.id,
    patientId: m.patientId ?? "",
    patientName: m.patientName ?? "",
    personalNumber: m.personalNumber ?? "",
    patientAge: m.patientAge ?? 0,
    modality: (m.modality ?? "X-Ray") as Modality,
    bodyPart: m.bodyPart ?? "",
    imageDataUrl: m.imageDataUrl ?? "",
    riskScore: r.riskScore ?? 0,
    riskLevel: (r.riskLevel ?? "LOW") as RiskLevel,
    findings: r.findings ?? [],
    impression: r.impression ?? "",
    recommendation: r.recommendation ?? "",
    archivedAt: s.timestamp,
    radiologistName: m.radiologistName ?? "—",
    department: r.department ?? m.department ?? [],
    status: "archived",
  };
}
