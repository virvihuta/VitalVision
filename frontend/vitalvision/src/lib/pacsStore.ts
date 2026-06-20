import type { DiagnosticReport, Alert } from "../types";

const DEMO_REPORTS: DiagnosticReport[] = [
  {
    id: "RPT-001", patientId: "PAT-1042", patientName: "Arben Kola", patientAge: 58,
    modality: "X-Ray", bodyPart: "Chest", imageDataUrl: "", riskScore: 87, riskLevel: "critical",
    findings: [
      { region: "Right lower lobe", description: "Dense consolidation consistent with bacterial pneumonia", severity: "severe" },
      { region: "Pleural space", description: "Small right-sided pleural effusion", severity: "moderate" },
    ],
    impression: "Findings highly suggestive of right lower lobe pneumonia with pleural effusion. Urgent intervention required.",
    recommendation: "Immediate antibiotic therapy. Follow-up CT within 48 hours. Consider ICU monitoring.",
    archivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    radiologistName: "Dr. Erion Basha", department: ["Emergency", "Pulmonology"], status: "archived",
  },
  {
    id: "RPT-002", patientId: "PAT-2088", patientName: "Fatmira Hoxha", patientAge: 34,
    modality: "CT", bodyPart: "Abdomen", imageDataUrl: "", riskScore: 42, riskLevel: "medium",
    findings: [
      { region: "Liver", description: "Mild hepatomegaly, no focal lesions identified", severity: "mild" },
      { region: "Gallbladder", description: "Multiple small calculi, no acute cholecystitis", severity: "moderate" },
    ],
    impression: "Mild hepatomegaly with cholelithiasis. No acute findings requiring emergency intervention.",
    recommendation: "Surgical consultation for elective cholecystectomy. Liver function tests advised.",
    archivedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    radiologistName: "Dr. Erion Basha", department: ["Surgery", "Gastroenterology"], status: "archived",
  },
  {
    id: "RPT-003", patientId: "PAT-3301", patientName: "Gëzim Shala", patientAge: 71,
    modality: "MRI", bodyPart: "Brain", imageDataUrl: "", riskScore: 91, riskLevel: "critical",
    findings: [
      { region: "Left MCA territory", description: "Acute ischemic infarct in left middle cerebral artery territory", severity: "severe" },
      { region: "Periventricular white matter", description: "Moderate chronic small vessel disease changes", severity: "moderate" },
    ],
    impression: "Acute ischemic stroke in the left MCA territory. Time-sensitive intervention required.",
    recommendation: "Immediate neurology consult. Thrombolysis evaluation if within window. ICU admission.",
    archivedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    radiologistName: "Dr. Albana Musta", department: ["Neurology", "ICU"], status: "archived",
  },
  {
    id: "RPT-004", patientId: "PAT-4455", patientName: "Mirela Duka", patientAge: 45,
    modality: "X-Ray", bodyPart: "Chest", imageDataUrl: "", riskScore: 18, riskLevel: "low",
    findings: [
      { region: "Lung fields", description: "Bilateral lung fields clear, no consolidation or effusion", severity: "normal" },
      { region: "Cardiomediastinal silhouette", description: "Normal size and contour", severity: "normal" },
    ],
    impression: "Normal chest radiograph. No acute cardiopulmonary process identified.",
    recommendation: "No further imaging required at this time. Routine follow-up as clinically indicated.",
    archivedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    radiologistName: "Dr. Erion Basha", department: [], status: "archived",
  },
  {
    id: "RPT-005", patientId: "PAT-5102", patientName: "Bujar Hoti", patientAge: 63,
    modality: "CT", bodyPart: "Chest", imageDataUrl: "", riskScore: 67, riskLevel: "high",
    findings: [
      { region: "Right upper lobe", description: "Spiculated nodule 12mm, highly suspicious for primary malignancy", severity: "severe" },
      { region: "Mediastinum", description: "Borderline enlarged mediastinal lymph nodes", severity: "moderate" },
    ],
    impression: "Right upper lobe spiculated nodule highly concerning for primary lung malignancy.",
    recommendation: "Urgent oncology referral. PET-CT staging recommended. Bronchoscopy with biopsy to confirm.",
    archivedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    radiologistName: "Dr. Albana Musta", department: ["Oncology", "Pulmonology"], status: "archived",
  },
  {
    id: "RPT-006", patientId: "PAT-6230", patientName: "Arta Leka", patientAge: 29,
    modality: "Ultrasound", bodyPart: "Abdomen", imageDataUrl: "", riskScore: 24, riskLevel: "low",
    findings: [
      { region: "Liver", description: "Normal echogenicity and size", severity: "normal" },
      { region: "Kidneys", description: "Both kidneys normal in size, no hydronephrosis", severity: "normal" },
    ],
    impression: "Unremarkable abdominal ultrasound. No significant pathology identified.",
    recommendation: "No further imaging required. Clinical correlation advised.",
    archivedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    radiologistName: "Dr. Erion Basha", department: [], status: "archived",
  },
  {
    id: "RPT-007", patientId: "PAT-7891", patientName: "Driton Berisha", patientAge: 52,
    modality: "X-Ray", bodyPart: "Chest", imageDataUrl: "", riskScore: 78, riskLevel: "critical",
    findings: [
      { region: "Bilateral lung fields", description: "Bilateral perihilar infiltrates consistent with pulmonary edema", severity: "severe" },
      { region: "Cardiac silhouette", description: "Cardiomegaly, cardiothoracic ratio > 0.55", severity: "moderate" },
    ],
    impression: "Findings consistent with acute decompensated heart failure with pulmonary edema.",
    recommendation: "Cardiology consult urgently. Diuresis and oxygen therapy. Echo within 24 hours.",
    archivedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    radiologistName: "Dr. Albana Musta", department: ["Cardiology", "Emergency"], status: "archived",
  },
  {
    id: "RPT-008", patientId: "PAT-8004", patientName: "Elona Myftari", patientAge: 38,
    modality: "MRI", bodyPart: "Spine", imageDataUrl: "", riskScore: 35, riskLevel: "medium",
    findings: [
      { region: "L4-L5 disc", description: "Moderate disc herniation with mild thecal sac compression", severity: "moderate" },
      { region: "L5-S1 disc", description: "Mild disc degeneration, no neural compression", severity: "mild" },
    ],
    impression: "L4-L5 disc herniation with moderate thecal sac compression. Correlate with clinical radiculopathy.",
    recommendation: "Neurosurgery consultation. Conservative management with physiotherapy initially.",
    archivedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    radiologistName: "Dr. Erion Basha", department: ["Neurosurgery"], status: "archived",
  },
  {
    id: "RPT-009", patientId: "PAT-9123", patientName: "Kujtim Avdyli", patientAge: 77,
    modality: "CT", bodyPart: "Brain", imageDataUrl: "", riskScore: 83, riskLevel: "critical",
    findings: [
      { region: "Right temporal lobe", description: "Acute subdural hematoma 8mm thickness with midline shift", severity: "severe" },
      { region: "Cortical sulci", description: "Diffuse sulcal effacement consistent with cerebral edema", severity: "severe" },
    ],
    impression: "Acute right-sided subdural hematoma with significant mass effect and midline shift. Neurosurgical emergency.",
    recommendation: "Immediate neurosurgery consult. Surgical evacuation likely required. ICU transfer.",
    archivedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    radiologistName: "Dr. Albana Musta", department: ["Neurosurgery", "ICU"], status: "archived",
  },
];

const DEMO_ALERTS: Alert[] = [
  {
    id: "ALT-001", reportId: "RPT-003", patientName: "Gëzim Shala", riskScore: 91, riskLevel: "critical",
    modality: "MRI", targetDepartments: ["Neurology", "ICU"],
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), read: false,
  },
  {
    id: "ALT-002", reportId: "RPT-001", patientName: "Arben Kola", riskScore: 87, riskLevel: "critical",
    modality: "X-Ray", targetDepartments: ["Emergency", "Pulmonology"],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), read: false,
  },
  {
    id: "ALT-003", reportId: "RPT-009", patientName: "Kujtim Avdyli", riskScore: 83, riskLevel: "critical",
    modality: "CT", targetDepartments: ["Neurosurgery", "ICU"],
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), read: true,
  },
  {
    id: "ALT-004", reportId: "RPT-007", patientName: "Driton Berisha", riskScore: 78, riskLevel: "critical",
    modality: "X-Ray", targetDepartments: ["Cardiology", "Emergency"],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), read: true,
  },
];

class PACSStore {
  private reports: DiagnosticReport[] = [...DEMO_REPORTS];
  private alerts: Alert[] = [...DEMO_ALERTS];
  private listeners: Set<() => void> = new Set();

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  getReports(): DiagnosticReport[] {
    return [...this.reports].sort(
      (a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()
    );
  }

  getReportById(id: string): DiagnosticReport | undefined {
    return this.reports.find((r) => r.id === id);
  }

  searchReports(query: string): DiagnosticReport[] {
    const q = query.toLowerCase();
    return this.reports.filter(
      (r) =>
        r.patientName.toLowerCase().includes(q) ||
        r.patientId.toLowerCase().includes(q) ||
        r.modality.toLowerCase().includes(q)
    );
  }

  archiveReport(report: DiagnosticReport): void {
    const newReport = { ...report, status: "archived" as const, archivedAt: new Date().toISOString() };
    this.reports = [newReport, ...this.reports];
    if (report.riskScore >= 75) {
      const alert: Alert = {
        id: `ALT-${Date.now()}`,
        reportId: report.id,
        patientName: report.patientName,
        riskScore: report.riskScore,
        riskLevel: report.riskLevel,
        modality: report.modality,
        targetDepartments: report.department,
        createdAt: new Date().toISOString(),
        read: false,
      };
      this.alerts = [alert, ...this.alerts];
    }
    this.notify();
  }

  getAlerts(): Alert[] {
    return [...this.alerts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  markAlertRead(id: string): void {
    this.alerts = this.alerts.map((a) => (a.id === id ? { ...a, read: true } : a));
    this.notify();
  }

  markAllAlertsRead(): void {
    this.alerts = this.alerts.map((a) => ({ ...a, read: true }));
    this.notify();
  }

  getUnreadAlertCount(): number {
    return this.alerts.filter((a) => !a.read).length;
  }

  getStats() {
    const total = this.reports.length;
    const critical = this.reports.filter((r) => r.riskLevel === "critical").length;
    const avgRisk = total
      ? Math.round(this.reports.reduce((s, r) => s + r.riskScore, 0) / total)
      : 0;
    const byModality: Record<string, number> = {};
    this.reports.forEach((r) => {
      byModality[r.modality] = (byModality[r.modality] || 0) + 1;
    });
    return { total, critical, avgRisk, byModality };
  }
}

export const pacsStore = new PACSStore();