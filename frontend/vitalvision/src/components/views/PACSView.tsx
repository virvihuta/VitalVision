import React, { useEffect, useMemo, useState } from "react";
import { Search, Database, FileText, User, Calendar, Sparkles } from "lucide-react";
import type { DiagnosticReport, Modality, RiskLevel } from "../../types";
import { usePACS } from "../../hooks/usePACS";
import { useLanguage } from "../../hooks/useLanguage";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { RiskBadge } from "../ui/RiskBadge";
import { RiskGauge } from "../ui/RiskGauge";
import { ExportPdfButton } from "../ui/ExportPdfButton";
import { t, localizeBodyPart, localizeSeverity, fmtAge } from "../../i18n";

const ACCENT = "#00d4aa";

type RiskFilter = "ALL" | RiskLevel;
type ModalityFilter = "ALL" | Modality;

const RISK_OPTIONS: RiskFilter[] = ["ALL", "LOW", "MODERATE", "HIGH", "CRITICAL"];
const MODALITY_OPTIONS: ModalityFilter[] = ["ALL", "X-Ray", "CT", "MRI", "Ultrasound"];
const BODY_PART_OPTIONS = [
  "ALL",
  "Chest",
  "Abdomen",
  "Head / Brain",
  "Spine",
  "Pelvis",
  "Extremities (Upper)",
  "Extremities (Lower)",
  "Neck",
  "Cardiac",
  "Full Body",
];

const SEVERITY_STYLES: Record<string, { bg: string; text: string }> = {
  normal: { bg: "bg-emerald-900/40", text: "text-emerald-400" },
  mild: { bg: "bg-orange-900/30", text: "text-orange-300" },
  moderate: { bg: "bg-amber-900/40", text: "text-amber-400" },
  severe: { bg: "bg-red-900/40", text: "text-red-400" },
};

function formatDateTime(iso: string, lang: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(lang === "sq" ? "sq-AL" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const PACSView: React.FC = () => {
  const { lang } = useLanguage();
  const { user } = useCurrentUser();
  const { reports, refetch } = usePACS();

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");
  const [modalityFilter, setModalityFilter] = useState<ModalityFilter>("ALL");
  const [bodyPartFilter, setBodyPartFilter] = useState<string>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports
      .filter((r) => {
        if (q) {
          const hay = `${r.patientName} ${r.personalNumber ?? ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (riskFilter !== "ALL" && r.riskLevel !== riskFilter) return false;
        if (modalityFilter !== "ALL" && r.modality !== modalityFilter) return false;
        if (bodyPartFilter !== "ALL" && r.bodyPart !== bodyPartFilter) return false;
        return true;
      })
      .sort(
        (a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()
      );
  }, [reports, search, riskFilter, modalityFilter, bodyPartFilter]);

  const selected: DiagnosticReport | undefined = useMemo(
    () => reports.find((r) => r.id === selectedId),
    [reports, selectedId]
  );

  const selectStyle = (active: boolean) =>
    `w-full bg-navy-700 border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-ai-cyan disabled:opacity-60 ${
      active ? "border-ai-cyan" : "border-navy-500"
    }`;

  const allLabel = t("filterAll", lang).toUpperCase();
  const riskLabel = (v: RiskFilter) => (v === "ALL" ? allLabel : t(v, lang));
  const bodyPartLabel = (v: string) => (v === "ALL" ? allLabel : localizeBodyPart(v, lang));
  const modalityLabel = (v: ModalityFilter) => (v === "ALL" ? allLabel : v);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center gap-2">
        <Database size={18} className="text-ai-cyan" />
        <div>
          <h1 className="text-xl font-semibold text-white">{t("pacsArchive", lang)}</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {filtered.length} {t("studies", lang)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT — list + filters */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPatients", lang)}
              className="w-full bg-navy-800 border border-navy-600 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-ai-cyan"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                {t("riskLevel", lang)}
              </label>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as RiskFilter)}
                className={selectStyle(riskFilter !== "ALL")}
              >
                {RISK_OPTIONS.map((r) => (
                  <option key={r} value={r}>{riskLabel(r)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                {t("modality", lang)}
              </label>
              <select
                value={modalityFilter}
                onChange={(e) => setModalityFilter(e.target.value as ModalityFilter)}
                className={selectStyle(modalityFilter !== "ALL")}
              >
                {MODALITY_OPTIONS.map((m) => (
                  <option key={m} value={m}>{modalityLabel(m)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                {t("bodyPart", lang)}
              </label>
              <select
                value={bodyPartFilter}
                onChange={(e) => setBodyPartFilter(e.target.value)}
                className={selectStyle(bodyPartFilter !== "ALL")}
              >
                {BODY_PART_OPTIONS.map((bp) => (
                  <option key={bp} value={bp}>{bodyPartLabel(bp)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="bg-navy-800/50 border border-navy-700 border-dashed rounded-xl p-10 text-center">
                <p className="text-sm text-slate-500">{t("noStudies", lang)}</p>
              </div>
            ) : (
              filtered.map((r) => {
                const isSelected = r.id === selectedId;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className="w-full text-left bg-navy-800 border rounded-xl p-3 transition-colors hover:border-navy-500"
                    style={{
                      borderColor: isSelected ? ACCENT : undefined,
                      borderWidth: isSelected ? 1.5 : 1,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{r.patientName}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                          {r.personalNumber || r.patientId}
                        </p>
                      </div>
                      <RiskBadge level={r.riskLevel} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{r.modality} · {localizeBodyPart(r.bodyPart, lang)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-1.5">
                      <Calendar size={11} />
                      {formatDateTime(r.archivedAt, lang)}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT — detail panel */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="h-full min-h-[420px] bg-navy-800/50 border border-navy-700 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-navy-700/60 flex items-center justify-center">
                <FileText size={22} className="text-slate-500" />
              </div>
              <p className="text-sm text-slate-400">{t("selectStudy", lang)}</p>
            </div>
          ) : (
            <div className="bg-navy-800 border border-navy-600 rounded-xl p-5 space-y-5">
              {/* Patient header */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-navy-700">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-ai-gradient-soft flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-ai-cyan" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-white truncate">{selected.patientName}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {selected.personalNumber || "—"} · {fmtAge(selected.patientAge, lang)} · {t("sex", lang)}: {selected.sex || "—"}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1">{user?.hospital ?? "—"}</p>
                  </div>
                </div>
                <RiskBadge level={selected.riskLevel} score={selected.riskScore} />
              </div>

              {/* Study metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <Meta label={t("studyId", lang)} value={selected.id} mono />
                <Meta label={t("archived", lang)} value={formatDateTime(selected.archivedAt, lang)} />
                <Meta label={t("modality", lang)} value={selected.modality} />
                <Meta label={t("bodyPart", lang)} value={localizeBodyPart(selected.bodyPart, lang) || "—"} />
              </div>

              {/* Gauge + image */}
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div className="flex-shrink-0 mx-auto sm:mx-0">
                  <RiskGauge score={selected.riskScore} size={120} />
                </div>
                {selected.imageDataUrl ? (
                  <div className="flex-1 w-full bg-navy-950 rounded-lg overflow-hidden border border-navy-700">
                    <img
                      src={selected.imageDataUrl}
                      alt={selected.patientName}
                      className="w-full max-h-72 object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex-1 w-full min-h-[180px] bg-navy-900 rounded-lg border border-dashed border-navy-600 flex items-center justify-center text-xs text-slate-600">
                    {t("noImage", lang)}
                  </div>
                )}
              </div>

              {/* Findings */}
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles size={11} className="text-ai-cyan" />
                  {t("findings", lang)}
                </p>
                <div className="space-y-2">
                  {selected.findings.length === 0 ? (
                    <p className="text-xs text-slate-600 italic">—</p>
                  ) : (
                    selected.findings.map((f, i) => {
                      const sev = SEVERITY_STYLES[f.severity] ?? SEVERITY_STYLES.mild;
                      return (
                        <div
                          key={i}
                          className="bg-navy-700 border border-navy-500 rounded-lg px-3 py-2.5"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-sm text-slate-200 font-medium">{f.region}</p>
                            <span
                              className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${sev.bg} ${sev.text}`}
                            >
                              {localizeSeverity(f.severity, lang)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{f.description}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Impression */}
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                  {t("impression", lang)}
                </p>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {selected.impression || "—"}
                </p>
              </div>

              {/* Recommendation */}
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                  {t("recommendation", lang)}
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {selected.recommendation || "—"}
                </p>
              </div>

              {/* PDF export */}
              <div className="pt-2 border-t border-navy-700 flex justify-end">
                <ExportPdfButton report={selected} hospital={user?.hospital ?? ""} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface MetaProps {
  label: string;
  value: string;
  mono?: boolean;
}

const Meta: React.FC<MetaProps> = ({ label, value, mono }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
    <p className={`text-xs text-slate-200 mt-0.5 truncate ${mono ? "font-mono" : ""}`}>{value}</p>
  </div>
);
