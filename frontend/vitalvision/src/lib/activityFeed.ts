import type { Language } from "../types";
import { t } from "../i18n";

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

const MODALITY_DETAIL = ["Chest X-Ray", "CT Abdomen", "MRI Brain", "Ultrasound"];
const DEPARTMENTS = ["Emergency", "Neurology", "Cardiology", "ICU"];
const REPORT_IDS = ["RPT-1042", "RPT-2088", "RPT-3301", "RPT-4455"];

const TYPES: ActivityEvent["type"][] = ["archived", "alert", "viewed", "analyzed", "login"];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

function detailFor(type: ActivityEvent["type"], lang: Language): string {
  switch (type) {
    case "archived":
      return fill(t("actArchived", lang), { modality: pick(MODALITY_DETAIL) });
    case "alert":
      return fill(t("actAlert", lang), { dept: pick(DEPARTMENTS) });
    case "viewed":
      return fill(t("actViewed", lang), { id: pick(REPORT_IDS) });
    case "login":
      return t("actLogin", lang);
    case "analyzed":
      return t("actAnalyzed", lang);
  }
}

export function generateEvent(now: number, lang: Language = "en"): ActivityEvent {
  const type = pick(TYPES);
  return {
    id: `evt-${now}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    actor: pick(ACTORS),
    detail: detailFor(type, lang),
    timestamp: now,
  };
}
