import React, { useMemo } from "react";
import { Activity, AlertOctagon, Gauge, Layers } from "lucide-react";
import type { Modality, RiskLevel } from "../../types";
import { usePACS } from "../../hooks/usePACS";
import { RiskBadge } from "../ui/RiskBadge";
import { useLanguage } from "../../hooks/useLanguage";
import { t } from "../../i18n";

const MODALITY_COLORS: Record<Modality, string> = {
  "X-Ray": "#3B82F6",
  CT: "#8B5CF6",
  MRI: "#EC4899",
  Ultrasound: "#10B981",
};

const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: "#10B981",
  MODERATE: "#F59E0B",
  HIGH: "#F97316",
  CRITICAL: "#EF4444",
};

interface SparklineProps {
  data: number[];
  labels: string[];
  color: string;
  height?: number;
  formatValue?: (v: number) => string;
}

const Sparkline: React.FC<SparklineProps> = ({
  data,
  labels,
  color,
  height = 120,
  formatValue = (v) => String(v),
}) => {
  const width = 100;
  const padding = 4;
  const max = Math.max(...data, 1);
  const min = 0;
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1 || 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return { x, y, value: v };
  });

  const pathLine = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const pathArea = `${pathLine} L${points[points.length - 1].x},${height - padding} L${points[0].x},${height - padding} Z`;
  const gradId = `grad-${color.replace("#", "")}`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={pathArea} fill={`url(#${gradId})`} />
        <path d={pathLine} fill="none" stroke={color} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1.2"
            fill={color}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div className="flex justify-between mt-1.5 px-1">
        {labels.map((l, i) => (
          <span key={i} className="text-[10px] text-slate-600 font-mono">{l}</span>
        ))}
      </div>
      <div className="flex justify-between mt-0.5 px-1">
        {points.map((p, i) => (
          <span key={i} className="text-[10px] text-slate-400 font-mono">
            {formatValue(p.value)}
          </span>
        ))}
      </div>
    </div>
  );
};

export const OpsView: React.FC = () => {
  const { lang } = useLanguage();
  const { reports, stats } = usePACS();

  const last7Days = useMemo(() => {
    const days: { label: string; date: Date }[] = [];
    const dayLabelsSq = ["Die", "Hën", "Mar", "Mër", "Enj", "Pre", "Sht"];
    const dayLabelsEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const labels = lang === "sq" ? dayLabelsSq : dayLabelsEn;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({ label: labels[d.getDay()], date: d });
    }
    return days;
  }, [lang]);

  const studiesPerDay = useMemo(() => {
    return last7Days.map(({ date }) => {
      const next = new Date(date);
      next.setDate(date.getDate() + 1);
      return reports.filter((r) => {
        const archived = new Date(r.archivedAt);
        return archived >= date && archived < next;
      }).length;
    });
  }, [last7Days, reports]);

  const avgRiskPerDay = useMemo(() => {
    return last7Days.map(({ date }) => {
      const next = new Date(date);
      next.setDate(date.getDate() + 1);
      const dayReports = reports.filter((r) => {
        const archived = new Date(r.archivedAt);
        return archived >= date && archived < next;
      });
      if (dayReports.length === 0) return 0;
      return Math.round(dayReports.reduce((s, r) => s + r.riskScore, 0) / dayReports.length);
    });
  }, [last7Days, reports]);

  const riskDistribution = useMemo(() => {
    const counts: Record<RiskLevel, number> = { LOW: 0, MODERATE: 0, HIGH: 0, CRITICAL: 0 };
    reports.forEach((r) => counts[r.riskLevel]++);
    return counts;
  }, [reports]);

  const sparkLabels = last7Days.map((d) => d.label);
  const totalForDist = reports.length || 1;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">{t("opsTitle", lang)}</h1>
        <p className="text-sm text-slate-400 mt-1">{t("opsSubtitle", lang)}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<Layers size={14} />}
          label={t("totalStudies", lang)}
          value={stats.total}
          accent="#3B82F6"
        />
        <StatCard
          icon={<AlertOctagon size={14} />}
          label={t("criticalCases", lang)}
          value={stats.critical}
          accent="#EF4444"
        />
        <StatCard
          icon={<Gauge size={14} />}
          label={t("avgRiskScore", lang)}
          value={stats.avgRisk}
          accent="#F59E0B"
          suffix="/100"
        />
        <StatCard
          icon={<Activity size={14} />}
          label={t("modalities", lang)}
          value={Object.keys(stats.byModality).length}
          accent="#10B981"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        <div className="bg-navy-800 border border-navy-600 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
            {t("studiesLast7", lang)}
          </p>
          <Sparkline data={studiesPerDay} labels={sparkLabels} color="#3B82F6" />
        </div>
        <div className="bg-navy-800 border border-navy-600 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
            {t("avgRiskLast7", lang)}
          </p>
          <Sparkline data={avgRiskPerDay} labels={sparkLabels} color="#F59E0B" />
        </div>
      </div>

      {/* Breakdown row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        <div className="bg-navy-800 border border-navy-600 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
            {t("byModality", lang)}
          </p>
          <div className="space-y-2.5">
            {(Object.entries(stats.byModality) as [Modality, number][]).map(([modality, count]) => {
              const pct = stats.total ? (count / stats.total) * 100 : 0;
              return (
                <div key={modality}>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: MODALITY_COLORS[modality] }}
                      />
                      <span className="text-slate-300">{modality}</span>
                    </div>
                    <span className="text-slate-500 font-mono">{count}</span>
                  </div>
                  <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: MODALITY_COLORS[modality] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-navy-800 border border-navy-600 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
            {t("riskDistribution", lang)}
          </p>
          <div className="space-y-2.5">
            {(Object.entries(riskDistribution) as [RiskLevel, number][]).map(([level, count]) => {
              const pct = (count / totalForDist) * 100;
              return (
                <div key={level}>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: RISK_COLORS[level] }}
                      />
                      <span className="text-slate-300">{t(level, lang)}</span>
                    </div>
                    <span className="text-slate-500 font-mono">{count}</span>
                  </div>
                  <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: RISK_COLORS[level] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent studies */}
      <div className="bg-navy-800 border border-navy-600 rounded-xl p-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
          {t("recentStudies", lang)}
        </p>
        <div className="space-y-1.5">
          {reports.slice(0, 6).map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between bg-navy-700 border border-navy-500 rounded-lg px-3 py-2.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: MODALITY_COLORS[r.modality] }}
                />
                <div className="min-w-0">
                  <p className="text-sm text-slate-200 font-medium truncate">{r.patientName}</p>
                  <p className="text-xs text-slate-500 font-mono">
                    {r.patientId} · {r.modality} — {r.bodyPart}
                  </p>
                </div>
              </div>
              <RiskBadge level={r.riskLevel} score={r.riskScore} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
  suffix?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, accent, suffix }) => (
  <div className="bg-navy-800 border border-navy-600 rounded-xl p-4">
    <div className="flex items-center gap-2 mb-2">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}
      >
        {icon}
      </div>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
    <p className="text-2xl font-mono font-medium text-white tabular-nums">
      {value}
      {suffix && <span className="text-sm text-slate-500 ml-1">{suffix}</span>}
    </p>
  </div>
);