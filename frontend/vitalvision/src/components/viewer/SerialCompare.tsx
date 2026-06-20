import React, { useState, useRef, useEffect } from "react";
import { X, GitCompare } from "lucide-react";
import type { DiagnosticReport } from "../../types";
import { RiskBadge } from "../ui/RiskBadge";
import { useLanguage } from "../../hooks/useLanguage";
import { t } from "../../i18n";

interface SerialCompareProps {
  before: DiagnosticReport;
  after: DiagnosticReport;
  onClose: () => void;
}

export const SerialCompare: React.FC<SerialCompareProps> = ({ before, after, onClose }) => {
  const { lang } = useLanguage();
  const [pos, setPos] = useState(50);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setContainerWidth(() => el.offsetWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onUp = () => { dragging.current = false; };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      setPos(Math.max(0, Math.min(100, x)));
    };
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === "sq" ? "sq-AL" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const hasImages = !!before.imageDataUrl && !!after.imageDataUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-overlay-in" style={{ background: "rgba(7,13,26,0.92)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-5xl bg-navy-800 border border-navy-600 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-navy-700">
          <div className="flex items-center gap-2">
            <GitCompare size={16} className="text-ai-cyan" />
            <div>
              <p className="text-sm font-semibold text-white">{t("serialComparison", lang)}</p>
              <p className="text-xs text-slate-500">
                {before.patientName} · {before.modality} — {before.bodyPart}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        {hasImages ? (
          <div
            ref={containerRef}
            className="relative bg-navy-950 select-none"
            style={{ height: 420, cursor: "ew-resize" }}
          >
            <img src={after.imageDataUrl} alt={t("latest", lang)} className="absolute inset-0 w-full h-full object-contain" />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${pos}%` }}
            >
              <img
                src={before.imageDataUrl}
                alt={t("earliest", lang)}
                className="absolute inset-0 h-full object-contain"
                style={{ width: containerWidth || "100%", maxWidth: "none" }}
              />
            </div>
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-ai-cyan"
              style={{ left: `${pos}%`, boxShadow: "0 0 12px #22D3EE" }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-ai-gradient flex items-center justify-center cursor-ew-resize shadow-xl"
              style={{ left: `${pos}%`, transform: "translate(-50%, -50%)" }}
              onPointerDown={() => { dragging.current = true; }}
            >
              <div className="flex gap-0.5">
                <div className="w-0.5 h-3 bg-white" />
                <div className="w-0.5 h-3 bg-white" />
              </div>
            </div>
            <div className="absolute top-3 left-3 bg-navy-900/80 backdrop-blur-sm border border-navy-600 rounded-lg px-2.5 py-1.5">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">{t("earliest", lang)}</p>
              <p className="text-xs text-slate-200 font-medium">{formatDate(before.archivedAt)}</p>
            </div>
            <div className="absolute top-3 right-3 bg-navy-900/80 backdrop-blur-sm border border-navy-600 rounded-lg px-2.5 py-1.5">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">{t("latest", lang)}</p>
              <p className="text-xs text-slate-200 font-medium">{formatDate(after.archivedAt)}</p>
            </div>
          </div>
        ) : (
          <div className="h-96 bg-navy-950 flex items-center justify-center">
            <p className="text-sm text-slate-500">
              {lang === "sq"
                ? "Imazhet nuk janë të disponueshme për këto studime demo"
                : "Images not available for these demo studies"}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 p-5 border-t border-navy-700">
          <div className="bg-navy-700 border border-navy-500 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{t("earliest", lang)}</span>
              <RiskBadge level={before.riskLevel} score={before.riskScore} />
            </div>
            <p className="text-xs text-slate-400">{before.impression}</p>
          </div>
          <div className="bg-navy-700 border border-navy-500 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{t("latest", lang)}</span>
              <RiskBadge level={after.riskLevel} score={after.riskScore} />
            </div>
            <p className="text-xs text-slate-400">{after.impression}</p>
          </div>
        </div>

        <p className="text-[10px] text-slate-600 text-center py-2 border-t border-navy-700">
          {t("dragSlider", lang)}
        </p>
      </div>
    </div>
  );
};