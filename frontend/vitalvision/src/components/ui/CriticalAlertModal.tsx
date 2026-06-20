import React, { useEffect, useState } from "react";
import { AlertTriangle, X, ExternalLink } from "lucide-react";
import type { DiagnosticReport } from "../../types";
import { RiskGauge } from "./RiskGauge";
import { useLanguage } from "../../hooks/useLanguage";
import { t, localizeBodyPart, fmtAge } from "../../i18n";

interface CriticalAlertModalProps {
  report: DiagnosticReport;
  onDismiss: () => void;
}

export const CriticalAlertModal: React.FC<CriticalAlertModalProps> = ({ report, onDismiss }) => {
  const { lang } = useLanguage();
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShaking(true), 100);
    const t2 = setTimeout(() => setShaking(false), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onDismiss(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onDismiss]);

  const isCritical = report.riskLevel === "CRITICAL";
  const accentColor = isCritical ? "#EF4444" : "#F97316";
  const bgPulse = isCritical ? "rgba(239,68,68,0.06)" : "rgba(249,115,22,0.06)";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-overlay-in"
      style={{ background: "rgba(7,13,26,0.85)", backdropFilter: "blur(4px)" }}
      onClick={onDismiss}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${bgPulse} 0%, transparent 70%)`,
          animation: "pulse-glow 1.8s ease-in-out infinite",
        }}
      />

      <div
        className={`relative w-full max-w-md mx-4 rounded-2xl border overflow-hidden animate-alert-in ${shaking ? "animate-shake" : ""}`}
        style={{
          background: "#0F1929",
          borderColor: `${accentColor}60`,
          boxShadow: `0 0 60px ${accentColor}30, 0 0 0 1px ${accentColor}20`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="h-1 w-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            animation: "pulse-glow 1.5s ease-in-out infinite",
          }}
        />

        <div className="flex items-start justify-between p-5 pb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: `${accentColor}20`,
                border: `1px solid ${accentColor}40`,
                animation: "pulse-glow 1.5s ease-in-out infinite",
              }}
            >
              <AlertTriangle size={18} style={{ color: accentColor }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: accentColor }}>
                {isCritical ? t("criticalDetected", lang) : t("highDetected", lang)}
              </p>
              <p className="text-white font-semibold text-base leading-tight mt-0.5">
                {t("studyArchived", lang)}
              </p>
            </div>
          </div>
          <button onClick={onDismiss} className="text-slate-500 hover:text-slate-300 transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          <div
            className="rounded-xl p-4 flex items-center gap-4"
            style={{ background: `${accentColor}0A`, border: `1px solid ${accentColor}25` }}
          >
            <RiskGauge score={report.riskScore} size={88} showLabel={false} animate />
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="text-white font-semibold text-sm">{report.patientName}</p>
              <p className="text-slate-400 text-xs font-mono">{report.patientId} · {fmtAge(report.patientAge, lang)}</p>
              <p className="text-slate-400 text-xs">{report.modality} — {localizeBodyPart(report.bodyPart, lang)}</p>
              <p className="text-xs font-mono" style={{ color: accentColor }}>
                {t("riskScore", lang)}: {report.riskScore}/100
              </p>
            </div>
          </div>

          {report.findings[0] && (
            <div className="rounded-lg px-3 py-2.5 bg-navy-700 border border-navy-500">
              <p className="text-xs text-slate-400 mb-1">{t("primaryFinding", lang)}</p>
              <p className="text-xs text-slate-200">
                <span className="text-slate-300 font-medium">{report.findings[0].region}</span>
                {" — "}
                {report.findings[0].description}
              </p>
            </div>
          )}

          {report.department.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-2">{t("departmentsNotified", lang)}</p>
              <div className="flex flex-wrap gap-2">
                {report.department.map((d) => (
                  <span
                    key={d}
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{
                      background: `${accentColor}18`,
                      color: accentColor,
                      border: `1px solid ${accentColor}35`,
                    }}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onDismiss}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-300 bg-navy-700 hover:bg-navy-600 border border-navy-500 transition-colors"
            >
              {t("dismiss", lang)}
            </button>
            <button
              onClick={onDismiss}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
              style={{ background: accentColor, color: "#fff" }}
            >
              <ExternalLink size={13} />
              {t("viewReport", lang)}
            </button>
          </div>
        </div>

        <div
          className="h-0.5 w-full"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)` }}
        />
      </div>
    </div>
  );
};