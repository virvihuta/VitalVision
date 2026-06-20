import type { DiagnosticReport, Finding, Modality, RiskLevel } from "../types";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}

function getDepartments(riskLevel: RiskLevel, modality: Modality, bodyPart: string): string[] {
  if (riskLevel === "critical" || riskLevel === "high") {
    const depts = ["Emergency"];
    if (modality === "MRI" && bodyPart.toLowerCase().includes("brain")) depts.push("Neurology");
    if (modality === "X-Ray" && bodyPart.toLowerCase().includes("chest")) depts.push("Pulmonology");
    if (bodyPart.toLowerCase().includes("abdomen")) depts.push("Surgery");
    if (bodyPart.toLowerCase().includes("heart") || bodyPart.toLowerCase().includes("cardiac")) depts.push("Cardiology");
    return depts;
  }
  return [];
}

export async function analyzeImage(
  imageDataUrl: string,
  patientName: string,
  patientAge: number,
  modality: Modality,
  bodyPart: string
): Promise<Partial<DiagnosticReport>> {
  const base64Data = imageDataUrl.split(",")[1];
  const mediaType = imageDataUrl.split(";")[0].split(":")[1] as "image/jpeg" | "image/png" | "image/webp";

  const systemPrompt = `You are an expert radiologist AI assistant providing structured diagnostic support.
Analyze the provided medical image and return a JSON object ONLY — no markdown, no preamble.

Return this exact structure:
{
  "riskScore": <integer 0-100>,
  "findings": [
    { "region": "<anatomical region>", "description": "<clinical finding>", "severity": "<normal|mild|moderate|severe>" }
  ],
  "impression": "<2-3 sentence radiological impression>",
  "recommendation": "<clinical recommendation for the treating physician>"
}

Scoring guide: 0-34 = low risk (normal/minor), 35-59 = medium (monitoring needed), 60-79 = high (prompt review), 80-100 = critical (urgent action).
Be specific and clinically accurate. Use proper radiological terminology.
If the image is unclear, low quality, or not a medical image, return riskScore 0 with a finding "image quality insufficient for reliable analysis".`;

  const userPrompt = `Patient: ${patientName}, Age: ${patientAge}
Modality: ${modality} — ${bodyPart}

Analyze this medical image and provide a structured diagnostic report.`;

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing VITE_ANTHROPIC_API_KEY in .env");

  const response = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-calls": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64Data },
            },
            { type: "text", text: userPrompt },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || "Analysis failed");
  }

  const data = await response.json();
  const text = data.content.find((c: { type: string }) => c.type === "text")?.text || "{}";
  const clean = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);

  const riskScore: number = parsed.riskScore ?? 0;
  const riskLevel = getRiskLevel(riskScore);
  const findings: Finding[] = parsed.findings ?? [];
  const departments = getDepartments(riskLevel, modality, bodyPart);

  return {
    riskScore,
    riskLevel,
    findings,
    impression: parsed.impression ?? "",
    recommendation: parsed.recommendation ?? "",
    department: departments,
  };
}