export interface ActivityEvent {
  id: string;
  type: "archived" | "alert" | "viewed" | "login" | "analyzed";
  actor: string;
  detail: string;
  timestamp: number;
}

const ACTORS = [
  "Dr. Erion Basha",
  "Dr. Albana Musta",
  "Dr. Arta Koci",
  "Dr. Mira Doci",
  "Dr. Genti Ruka",
];

const DETAILS = {
  archived: [
    "Chest X-Ray archived to PACS",
    "CT Abdomen archived to PACS",
    "MRI Brain archived to PACS",
    "Ultrasound study archived",
  ],
  alert: [
    "Critical alert sent to Emergency",
    "High-risk case flagged for Neurology",
    "Alert dispatched to Cardiology",
    "ICU notified of acute finding",
  ],
  viewed: [
    "Viewed report RPT-1042",
    "Reviewed CT scan",
    "Accessed shared archive",
    "Opened patient record",
  ],
  login: [
    "Signed in to VitalVision",
    "Started a new shift",
  ],
  analyzed: [
    "AI analysis completed",
    "New diagnostic report generated",
    "Image processed by AI",
  ],
};

const TYPES: ActivityEvent["type"][] = ["archived", "alert", "viewed", "analyzed", "login"];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateEvent(now: number): ActivityEvent {
  const type = pick(TYPES);
  return {
    id: `evt-${now}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    actor: pick(ACTORS),
    detail: pick(DETAILS[type]),
    timestamp: now,
  };
}