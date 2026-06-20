import type { DiagnosticReport } from "../types";

// Pre-built critical case used for the demo
export const DEMO_REPORT: DiagnosticReport = {
  id: `RPT-DEMO-${Date.now()}`,
  patientId: "PAT-DEMO-7777",
  patientName: "Endrit Marku",
  patientAge: 64,
  modality: "X-Ray",
  bodyPart: "Chest",
  imageDataUrl: "",
  riskScore: 89,
  riskLevel: "critical",
  findings: [
    {
      region: "Right lower lobe",
      description: "Dense consolidation with air bronchograms — bacterial pneumonia",
      severity: "severe",
    },
    {
      region: "Pleural space",
      description: "Right-sided pleural effusion, moderate volume",
      severity: "moderate",
    },
    {
      region: "Cardiac silhouette",
      description: "Normal cardiothoracic ratio",
      severity: "normal",
    },
  ],
  impression:
    "Findings highly suggestive of severe right lower lobe pneumonia with pleural effusion. Urgent intervention required.",
  recommendation:
    "Immediate broad-spectrum antibiotics. Repeat imaging in 48 hours. Consider ICU monitoring if respiratory status deteriorates.",
  archivedAt: new Date().toISOString(),
  radiologistName: "Dr. Erion Basha",
  department: ["Emergency", "Pulmonology"],
  status: "analyzed",
};

export interface DemoStep {
  duration: number; // ms
  labelKey:
    | "demoStep1"
    | "demoStep2"
    | "demoStep3"
    | "demoStep4"
    | "demoStep5"
    | "demoStep6";
  action: string; // app-level action name
}

export const DEMO_SCRIPT: DemoStep[] = [
  { duration: 3500, labelKey: "demoStep1", action: "showRadiologist" },
  { duration: 3500, labelKey: "demoStep2", action: "showAnalysis" },
  { duration: 4500, labelKey: "demoStep3", action: "showHeatmap" },
  { duration: 4000, labelKey: "demoStep4", action: "fireAlert" },
  { duration: 4500, labelKey: "demoStep5", action: "showDoctor" },
  { duration: 4500, labelKey: "demoStep6", action: "showOps" },
];