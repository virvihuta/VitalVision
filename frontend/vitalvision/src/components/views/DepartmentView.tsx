import React, { useState, useMemo } from "react";
import { Search, User, FileText, Calendar } from "lucide-react";
import type { DiagnosticReport } from "../../types";
import { usePACS } from "../../hooks/usePACS";
import { pacsStore } from "../../lib/pacsStore";
import { RiskGauge } from "../ui/RiskGauge";
import { RiskBadge } from "../ui/RiskBadge";
import { ExportPdfButton } from "../ui/ExportPdfButton";
import { ImageViewer3D } from "../viewer/ImageViewer3D";
import { PatientTimeline } from "./PatientTimeline";
import { SerialCompare } from "../viewer/SerialCompare";
import { useLanguage } from "../../hooks/useLanguage";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { t } from "../../i18n";

export const DepartmentView: React.FC = () => {
  const { lang } = useLanguage();
  const { reports } = usePACS();
  const currentUser = useCurrentUser("doctor");

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);

  const patientGroups = useMemo(() => {
    const map = new Map<string, DiagnosticReport[]>();
    for (const r of reports) {
      if (!map.has(r.patientId)) map.set(r.patientId, []);
      map.get(r.patientId)!.push(r);
    }
    return Array.from(map.entries()).map(([patientId, list]) => {
      const sorted = [...list].sort(
        (a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()
      );
      return { patientId, latest: sorted[0], count: sorted.length, all: sorted };
    });
  }, [reports]);

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return patientGroups;
    const q = query.toLowerCase();
    return patientGroups.filter(
      (g) =>
        g.latest.patientName.toLowerCase().includes(q) ||
        g.patientId.toLowerCase().includes(q) ||
        g.latest.modality.toLowerCase().includes(q) ||
        g.latest.bodyPart.toLowerCase().includes(q)
    );
  }, [patientGroups, query]);

  const selected: DiagnosticReport | undefined = useMemo(
    () => reports.find((r) => r.id === selectedId),
    [reports, selectedId]
  );

  const patientStudies = useMemo(
    () => (selected ? pacsStore.getReportsByPatient(selected.patientId) : []),
    [selected]
  );

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(lang === "sq" ? "sq-AL" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">{t("patientSearch", lang)}</h1>
        <p className="text-sm text-slate-400 mt-1">
          {lang === "sq"
            ? "Kërko pacientë dhe shiko raportet e arkivuara"
            : "Search patients and view archived reports"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — patient list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder={t("searchPlaceholder", lang)}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-navy-800 border border-navy-600 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-ai-cyan"
            />
          </div>

          <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {filteredGroups.length === 0 ? (
              <div className="bg-navy-800/50 border border-navy-700 border-dashed rounded-xl p-8 text-center">
                <p className="text-sm text-slate-500">{t("noPatients", lang)}</p>
              </div>
            ) : (
              filteredGroups.map((g) => (
                <button
                  key={g.patientId}
                  onClick={() => setSelectedId(g.latest.id)}
                  className={`w-full text-left bg-navy-800 border rounded-xl p-3 transition-colors ${
                    selected?.patientId === g.patientId
                      ? "border-ai-cyan"
                      : "border-navy-600 hover:border-navy-500"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <User size={13} className="text-slate-500 flex-shrink-0" />
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {g.latest.patientName}
                      </p>
                    </div>
                    <RiskBadge level={g.latest.riskLevel} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span>{g.patientId}</span>
                    <span>
                      {g.count > 1
                        ? `${g.count} ${t("studies", lang)}`
                        : `${g.latest.modality} · ${g.latest.bodyPart}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1.5">
                    <Calendar size={11} />
                    {formatTime(g.latest.archivedAt)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right — timeline + selected report */}
        <div className="lg:col-span-3 space-y-4">
          {!selected ? (
            <div className="h-full min-h-96 bg-navy-800/50 border border-navy-700 border-dashed rounded-xl flex flex-col items-center justify-center gap-3">
              <FileText size={32} className="text-slate-600" />
              <p className="text-sm text-slate-500">{t("selectPatient", lang)}</p>
            </div>
          ) : (
            <>
              {patientStudies.length > 1 && (
                <PatientTimeline
                  studies={patientStudies}
                  selectedId={selected.id}
                  onSelect={setSelectedId}
                  onCompare={() => setComparing(true)}
                />
              )}

              {selected.imageDataUrl && (
                <ImageViewer3D imageDataUrl={selected.imageDataUrl} height={300} />
              )}

              <div className="bg-navy-800 border border-navy-600 rounded-xl p-5">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <p className="text-white font-semibold text-base">{selected.patientName}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {selected.patientId} · {selected.patientAge}y · {selected.modality} — {selected.bodyPart}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {t("radiologist", lang)}: {selected.radiologistName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t("archived", lang)}: {formatTime(selected.archivedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ExportPdfButton report={selected} hospital={currentUser.hospital} />
                    <RiskBadge level={selected.riskLevel} score={selected.riskScore} />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-5 mb-5">
                  <div className="flex justify-center sm:justify-start">
                    <RiskGauge score={selected.riskScore} size={104} />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                        {t("impression", lang)}
                      </p>
                      <p className="text-sm text-slate-200 leading-relaxed">{selected.impression}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                        {t("recommendation", lang)}
                      </p>
                      <p className="text-sm text-slate-300 leading-relaxed">{selected.recommendation}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    {t("findings", lang)}
                  </p>
                  <div className="space-y-2">
                    {selected.findings.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 bg-navy-700 border border-navy-500 rounded-lg px-3 py-2.5"
                      >
                        <span
                          className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            f.severity === "severe"
                              ? "bg-red-400"
                              : f.severity === "moderate"
                              ? "bg-amber-400"
                              : f.severity === "mild"
                              ? "bg-orange-300"
                              : "bg-emerald-400"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-slate-200 font-medium">{f.region}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{f.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selected.department.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-navy-600">
                    <p className="text-xs text-slate-400 mb-2">{t("notified", lang)}</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.department.map((d) => (
                        <span
                          key={d}
                          className="text-xs px-2.5 py-1 rounded-full font-medium bg-clinical-blue/15 text-clinical-blue-light border border-clinical-blue/30"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {comparing && patientStudies.length >= 2 && (
        <SerialCompare
          before={patientStudies[0]}
          after={patientStudies[patientStudies.length - 1]}
          onClose={() => setComparing(false)}
        />
      )}
    </div>
  );
};