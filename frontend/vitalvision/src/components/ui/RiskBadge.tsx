import React from "react";
import type { RiskLevel } from "../../types";
import { useLanguage } from "../../hooks/useLanguage";
import { t } from "../../i18n";

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
}

const STYLES: Record<RiskLevel, { bg: string; text: string; dot: string }> = {
  LOW: { bg: "bg-emerald-900/40", text: "text-emerald-400", dot: "bg-emerald-400" },
  MODERATE: { bg: "bg-amber-900/40", text: "text-amber-400", dot: "bg-amber-400" },
  HIGH: { bg: "bg-orange-900/40", text: "text-orange-400", dot: "bg-orange-400" },
  CRITICAL: { bg: "bg-red-900/40", text: "text-red-400", dot: "bg-red-400" },
};

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score }) => {
  const { lang } = useLanguage();
  const s = STYLES[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${s.dot} ${level === "CRITICAL" ? "pulse-critical" : ""}`}
      />
      {score !== undefined ? `${score} — ` : ""}
      {t(level, lang)}
    </span>
  );
};