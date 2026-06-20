import React from "react";
import { Activity, ArrowRight } from "lucide-react";
import type { DiagnosticReport, RiskLevel } from "../../types";
import { RiskBadge } from "../ui/RiskBadge";
import { useLanguage } from "../../hooks/useLanguage";
import { t } from "../../i18n";

interface PatientTimelineProps {
  studies: DiagnosticReport[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCompare?: () => void;
}

const RISK_COLOR: Record<RiskLevel, string> = {
  LOW: "#10B981",
  MODERATE: "#F59E0B",
  HIGH: "#F97316",
  CRITICAL: "#EF4444",
};

export const PatientTimeline: React.FC<PatientTimelineProps> = ({
  studies,
  selectedId,
  onSelect,
  onCompare,
}) => {
  const { lang } = useLanguage();

  if (studies.length < 2) return null;

  const sorted = [...studies].sort(
    (a, b) => new Date(a.archivedAt).getTime() - new Date(b.archivedAt).getTime()
  );

  // Build sparkline for risk trend
  const width = 100;
  const height = 40;
  const padding = 4;
  const max = 100;
  const points = sorted.map((s, i) => {
    const x = (i / (sorted.length - 1 || 1)) * (width - padding * 2) + padding;
    const y = height - padding - (s.riskScore / max) * (height - padding * 2);
    return { x, y, score: s.riskScore, id: s.id };
  });

  const pathLine = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const pathArea = `${pathLine} L${points[points.length - 1].x},${height - padding} L${points[0].x},${height - padding} Z`;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === "sq" ? "sq-AL" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="bg-navy-800 border border-navy-600 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-navy-700">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-ai-cyan" />
          <p className="text-xs font-medium text-slate-300">{t("patientTimeline", lang)}</p>
          <span className="text-[10px] text-slate-500 font-mono">
            {sorted.length} {t("studies", lang)}
          </span>
        </div>
        {onCompare && sorted.length >= 2 && (
          <button
            onClick={onCompare}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded bg-ai-gradient text-white hover:shadow-md hover:shadow-ai-violet/30 transition-shadow"
          >
            {t("compare", lang)}
            <ArrowRight size={11} />
          </button>
        )}
      </div>

      {/* Sparkline */}
      <div className="px-4 pt-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="w-full"
          style={{ height: 56 }}
        >
          <defs>
            <linearGradient id="timeline-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A855F7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={pathArea} fill="url(#timeline-grad)" />
          <path d={pathLine} fill="none" stroke="#A855F7" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          {points.map((p, i) => {
            const isSelected = p.id === selectedId;
            return (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={isSelected ? "2" : "1.4"}
                fill={RISK_COLOR[sorted[i].riskLevel]}
                stroke="#070D1A"
                strokeWidth="0.4"
                vectorEffect="non-scaling-stroke"
                style={{ cursor: "pointer" }}
                onClick={() => onSelect(p.id)}
              />
            );
          })}
        </svg>
      </div>

      {/* Study cards in timeline order */}
      <div className="p-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${sorted.length}, minmax(0, 1fr))` }}>
        {sorted.map((s) => {
          const selected = s.id === selectedId;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`text-left p-2.5 rounded-lg border transition-all ${
                selected
                  ? "bg-navy-600 border-ai-cyan"
                  : "bg-navy-700 border-navy-500 hover:border-navy-400"
              }`}
            >
              <p className="text-[10px] text-slate-500 font-mono mb-1">{formatDate(s.archivedAt)}</p>
              <p className="text-xs text-slate-300 font-medium truncate mb-1.5">
                {s.modality} — {s.bodyPart}
              </p>
              <RiskBadge level={s.riskLevel} score={s.riskScore} />
            </button>
          );
        })}
      </div>
    </div>
  );
};