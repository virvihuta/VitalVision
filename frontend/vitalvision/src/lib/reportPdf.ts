import type { DiagnosticReport, Language } from "../types";
import { t } from "../i18n";

const SEVERITY_LABEL_EN = {
  normal: "Normal",
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
};

const SEVERITY_LABEL_SQ = {
  normal: "Normal",
  mild: "I lehtë",
  moderate: "Mesatar",
  severe: "I rëndë",
};

const SEVERITY_COLOR = {
  normal: "#10B981",
  mild: "#FBBF24",
  moderate: "#F59E0B",
  severe: "#EF4444",
};

const RISK_COLOR = {
  low: "#10B981",
  medium: "#F59E0B",
  high: "#F97316",
  critical: "#EF4444",
};

export function exportReportAsPdf(report: DiagnosticReport, hospital: string, lang: Language) {
  const sevLabels = lang === "sq" ? SEVERITY_LABEL_SQ : SEVERITY_LABEL_EN;
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString(lang === "sq" ? "sq-AL" : "en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const html = `
<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<title>${report.patientName} — ${report.id}</title>
<style>
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Segoe UI", Inter, sans-serif;
    color: #1A2740;
    margin: 0;
    line-height: 1.55;
    font-size: 11pt;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid ${RISK_COLOR[report.riskLevel]};
    padding-bottom: 14px;
    margin-bottom: 20px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .brand-logo {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: linear-gradient(135deg, #22D3EE 0%, #A855F7 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 14pt;
  }
  .brand-text h1 {
    margin: 0;
    font-size: 14pt;
    color: #0F1929;
  }
  .brand-text p {
    margin: 0;
    font-size: 9pt;
    color: #64748B;
  }
  .meta {
    text-align: right;
    font-size: 9pt;
    color: #64748B;
  }
  .meta .id {
    font-family: ui-monospace, Menlo, monospace;
    font-size: 9pt;
    color: #1A2740;
    font-weight: 600;
  }
  .hospital {
    font-size: 10pt;
    color: #1A2740;
    font-weight: 600;
    margin-top: 4px;
  }
  .patient-bar {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 14px 18px;
    margin-bottom: 20px;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 20px;
  }
  .patient-name {
    font-size: 14pt;
    font-weight: 600;
    color: #0F1929;
    margin: 0 0 4px 0;
  }
  .patient-details {
    font-family: ui-monospace, Menlo, monospace;
    font-size: 9pt;
    color: #64748B;
  }
  .risk-circle {
    width: 78px;
    height: 78px;
    border-radius: 50%;
    border: 5px solid ${RISK_COLOR[report.riskLevel]};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: white;
  }
  .risk-score {
    font-family: ui-monospace, Menlo, monospace;
    font-size: 18pt;
    font-weight: 600;
    color: ${RISK_COLOR[report.riskLevel]};
    line-height: 1;
  }
  .risk-label {
    font-size: 7pt;
    color: ${RISK_COLOR[report.riskLevel]};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 2px;
  }
  h2 {
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #64748B;
    margin: 18px 0 8px 0;
    font-weight: 600;
  }
  .section {
    background: white;
    border: 1px solid #E2E8F0;
    border-radius: 6px;
    padding: 12px 14px;
    margin-bottom: 12px;
    color: #1A2740;
    font-size: 10pt;
  }
  .findings { list-style: none; padding: 0; margin: 0; }
  .findings li {
    display: flex;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid #E2E8F0;
    border-left: 3px solid #CBD5E1;
    border-radius: 4px;
    margin-bottom: 6px;
    font-size: 10pt;
  }
  .finding-num {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border-radius: 10px;
    background: #CBD5E1;
    color: white;
    font-size: 9pt;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: ui-monospace, Menlo, monospace;
  }
  .finding-region {
    font-weight: 600;
    color: #0F1929;
  }
  .finding-desc {
    color: #475569;
    font-size: 9.5pt;
    margin-top: 2px;
  }
  .finding-sev {
    display: inline-block;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 1px 6px;
    border-radius: 3px;
    margin-top: 4px;
    font-weight: 600;
  }
  .departments {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }
  .dept-pill {
    font-size: 8.5pt;
    background: #EFF6FF;
    color: #1D4ED8;
    border: 1px solid #BFDBFE;
    padding: 3px 8px;
    border-radius: 999px;
  }
  .footer {
    margin-top: 28px;
    padding-top: 14px;
    border-top: 1px solid #E2E8F0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    font-size: 9pt;
    color: #64748B;
  }
  .sig-line {
    border-top: 1px solid #94A3B8;
    margin-top: 28px;
    padding-top: 4px;
    font-size: 8.5pt;
    color: #475569;
  }
  .disclaimer {
    margin-top: 18px;
    font-size: 8pt;
    color: #94A3B8;
    text-align: center;
    line-height: 1.5;
  }
  .ai-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 8.5pt;
    background: linear-gradient(135deg, rgba(34,211,238,0.12) 0%, rgba(168,85,247,0.12) 100%);
    color: #7C3AED;
    border: 1px solid rgba(168,85,247,0.25);
    padding: 2px 8px;
    border-radius: 999px;
    font-weight: 500;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="brand-logo">V</div>
      <div class="brand-text">
        <h1>VitalVision</h1>
        <p>${t("aiPowered", lang)} — ${lang === "sq" ? "Raport Diagnostik" : "Diagnostic Report"}</p>
      </div>
    </div>
    <div class="meta">
      <div class="id">${report.id}</div>
      <div class="hospital">${hospital === "QSUT" ? "Qendra Spitalore Universitare Tiranë" : hospital}</div>
      <div>${fmtDate(report.archivedAt)}</div>
    </div>
  </div>

  <div class="patient-bar">
    <div>
      <p class="patient-name">${report.patientName}</p>
      <p class="patient-details">${report.patientId} · ${report.patientAge} ${lang === "sq" ? "vjeç" : "y"} · ${report.modality} — ${report.bodyPart}</p>
      <p class="patient-details" style="margin-top:6px;color:#475569;">
        ${t("radiologist", lang)}: <strong>${report.radiologistName}</strong>
      </p>
    </div>
    <div class="risk-circle">
      <div class="risk-score">${report.riskScore}</div>
      <div class="risk-label">${t(report.riskLevel, lang)}</div>
    </div>
  </div>

  ${
    report.imageDataUrl
      ? `<h2>${lang === "sq" ? "Imazhi" : "Image"}</h2>
         <div class="section" style="text-align:center;padding:8px;">
           <img src="${report.imageDataUrl}" style="max-width:100%;max-height:280px;object-fit:contain;" alt="Scan" />
         </div>`
      : ""
  }

  <h2>${t("impression", lang)} <span class="ai-badge">${t("aiPowered", lang)}</span></h2>
  <div class="section">${report.impression}</div>

  <h2>${t("recommendation", lang)}</h2>
  <div class="section">${report.recommendation}</div>

  <h2>${t("findings", lang)}</h2>
  <ul class="findings">
    ${report.findings
      .map(
        (f, i) => `
      <li style="border-left-color:${SEVERITY_COLOR[f.severity]};">
        <div class="finding-num" style="background:${SEVERITY_COLOR[f.severity]};">${i + 1}</div>
        <div style="flex:1;">
          <div class="finding-region">${f.region}</div>
          <div class="finding-desc">${f.description}</div>
          <span class="finding-sev" style="background:${SEVERITY_COLOR[f.severity]}22;color:${SEVERITY_COLOR[f.severity]};">${sevLabels[f.severity]}</span>
        </div>
      </li>
    `
      )
      .join("")}
  </ul>

  ${
    report.department.length
      ? `<h2>${t("departmentsNotified", lang)}</h2>
         <div class="departments">
           ${report.department.map((d) => `<span class="dept-pill">${d}</span>`).join("")}
         </div>`
      : ""
  }

  <div class="footer">
    <div>
      <div class="sig-line">${t("radiologist", lang)}: ${report.radiologistName}</div>
    </div>
    <div>
      <div class="sig-line">${lang === "sq" ? "Nënshkrimi Mjekut" : "Reviewing Physician"}</div>
    </div>
  </div>

  <div class="disclaimer">
    ${
      lang === "sq"
        ? "Ky raport është gjeneruar me ndihmën e inteligjencës artificiale dhe duhet të verifikohet nga një mjek i kualifikuar përpara çdo vendimi klinik."
        : "This report was generated with AI assistance and must be verified by a qualified physician before any clinical decision."
    }
  </div>

  <script>
    window.addEventListener("load", () => {
      setTimeout(() => { window.print(); }, 400);
    });
  </script>
</body>
</html>
  `.trim();

  const win = window.open("", "_blank", "width=900,height=1100");
  if (!win) {
    alert(lang === "sq" ? "Lejo popup-et për të printuar" : "Allow pop-ups to print");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}