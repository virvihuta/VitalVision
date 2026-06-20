import React, { useState, useRef } from "react";
import { Upload, Sparkles, Loader2, ShieldCheck, X, FileImage } from "lucide-react";
import type { DiagnosticReport, Modality } from "../../types";
import { analyzeImage } from "../../api/anthropicApi";
import { pacsStore } from "../../lib/pacsStore";
import { RiskGauge } from "../ui/RiskGauge";
import { RiskBadge } from "../ui/RiskBadge";
import { CriticalAlertModal } from "../ui/CriticalAlertModal";
import { ImageViewer3D } from "../viewer/ImageViewer3D";
import { useToast } from "../ui/Toast";
import { useLanguage } from "../../hooks/useLanguage";
import { t } from "../../i18n";

const MODALITIES: Modality[] = ["X-Ray", "CT", "MRI", "Ultrasound"];

type Status = "idle" | "analyzing" | "done" | "error";

export const RadiologistView: React.FC = () => {
  const { lang } = useLanguage();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [modality, setModality] = useState<Modality>("X-Ray");
  const [bodyPart, setBodyPart] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [archived, setArchived] = useState(false);
  const [alertReport, setAlertReport] = useState<DiagnosticReport | null>(null);

  const canAnalyze = patientName.trim() && patientAge.trim() && bodyPart.trim() && imageDataUrl;

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const runAnalysis = async () => {
    if (!imageDataUrl) return;
    setStatus("analyzing");
    setErrorMsg("");
    try {
      const result = await analyzeImage(
        imageDataUrl,
        patientName,
        parseInt(patientAge, 10),
        modality,
        bodyPart
      );
      const newReport: DiagnosticReport = {
        id: `RPT-${Date.now()}`,
        patientId: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
        patientName,
        patientAge: parseInt(patientAge, 10),
        modality,
        bodyPart,
        imageDataUrl,
        riskScore: result.riskScore ?? 0,
        riskLevel: result.riskLevel ?? "low",
        findings: result.findings ?? [],
        impression: result.impression ?? "",
        recommendation: result.recommendation ?? "",
        archivedAt: new Date().toISOString(),
        radiologistName: "Dr. Erion Basha",
        department: result.department ?? [],
        status: "analyzed",
      };
      setReport(newReport);
      setStatus("done");
      showToast(lang === "sq" ? "Analiza përfundoi" : "Analysis complete", "success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Analysis failed");
      showToast(lang === "sq" ? "Analiza dështoi" : "Analysis failed", "error");
    }
  };

  const archiveReport = () => {
    if (!report) return;
    pacsStore.archiveReport(report);
    setArchived(true);
    showToast(t("studyArchived", lang), "success");
    if (report.riskScore >= 75) {
      setAlertReport(report);
    }
  };

  const reset = () => {
    setPatientName("");
    setPatientAge("");
    setBodyPart("");
    setImageDataUrl(null);
    setStatus("idle");
    setReport(null);
    setArchived(false);
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">{t("uploadTitle", lang)}</h1>
        <p className="text-sm text-slate-400 mt-1">{t("uploadSubtitle", lang)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — form + upload */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-navy-800 border border-navy-600 rounded-xl p-4 space-y-3">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {t("patientInfo", lang)}
            </p>
            <input
              type="text"
              placeholder={t("fullName", lang)}
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              disabled={status === "analyzing" || status === "done"}
              className="w-full bg-navy-700 border border-navy-500 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-ai-cyan disabled:opacity-60"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder={t("age", lang)}
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                disabled={status === "analyzing" || status === "done"}
                className="w-full bg-navy-700 border border-navy-500 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-ai-cyan disabled:opacity-60"
              />
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value as Modality)}
                disabled={status === "analyzing" || status === "done"}
                className="w-full bg-navy-700 border border-navy-500 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-ai-cyan disabled:opacity-60"
              >
                {MODALITIES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              placeholder={lang === "sq" ? "Pjesa e trupit (p.sh. kraharori)" : "Body part (e.g. chest)"}
              value={bodyPart}
              onChange={(e) => setBodyPart(e.target.value)}
              disabled={status === "analyzing" || status === "done"}
              className="w-full bg-navy-700 border border-navy-500 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-ai-cyan disabled:opacity-60"
            />
          </div>

          {!imageDataUrl ? (
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="bg-navy-800 border-2 border-dashed border-navy-500 rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-ai-cyan transition-colors"
            >
              <Upload size={28} className="text-slate-500 mb-3" />
              <p className="text-sm text-slate-300">{t("dropImage", lang)}</p>
              <p className="text-xs text-slate-500 mt-1">{t("dropSubtitle", lang)}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="bg-navy-800 border border-navy-600 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <FileImage size={14} />
                  {lang === "sq" ? "Imazhi i ngarkuar" : "Image loaded"}
                </div>
                {status === "idle" && (
                  <button
                    onClick={() => setImageDataUrl(null)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <img
                src={imageDataUrl}
                alt="Uploaded medical scan"
                className="w-full rounded-lg max-h-64 object-contain bg-navy-950"
              />
            </div>
          )}

          {status === "idle" && (
            <button
              onClick={runAnalysis}
              disabled={!canAnalyze}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium bg-ai-gradient text-white shadow-lg shadow-ai-violet/20 hover:shadow-ai-violet/40 transition-shadow disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <Sparkles size={16} />
              {t("runAnalysis", lang)}
            </button>
          )}

          {status === "analyzing" && (
            <div className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium bg-navy-700 text-slate-300 border border-navy-500">
              <Loader2 size={16} className="animate-spin" />
              {t("analyzing", lang)}
            </div>
          )}

          {status === "error" && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-sm text-red-300">
              {errorMsg}
            </div>
          )}

          {status === "done" && (
            <div className="space-y-2">
              {!archived ? (
                <button
                  onClick={archiveReport}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                >
                  <ShieldCheck size={16} />
                  {t("archiveToPACS", lang)}
                </button>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-800">
                  <ShieldCheck size={16} />
                  {t("archivedToPACS", lang)}
                </div>
              )}
              <button
                onClick={reset}
                className="w-full py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-navy-700 transition-colors"
              >
                {t("clearStart", lang)}
              </button>
            </div>
          )}
        </div>

        {/* Right — report + viewer */}
        <div className="lg:col-span-3 space-y-4">
          {!report ? (
            <div className="h-full min-h-96 bg-navy-800/50 border border-navy-700 border-dashed rounded-xl flex items-center justify-center">
              <p className="text-sm text-slate-500">
                {lang === "sq"
                  ? "Raporti do të shfaqet këtu pas analizës"
                  : "Report will appear here after analysis"}
              </p>
            </div>
          ) : (
            <>
              {imageDataUrl && <ImageViewer3D imageDataUrl={imageDataUrl} height={320} />}

              <div className="bg-navy-800 border border-navy-600 rounded-xl p-5">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-white font-semibold">{report.patientName}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {report.patientId} · {report.patientAge}y · {report.modality} — {report.bodyPart}
                    </p>
                  </div>
                  <RiskBadge level={report.riskLevel} />
                </div>

                <div className="flex flex-col sm:flex-row gap-5 mb-5">
                  <div className="flex justify-center sm:justify-start">
                    <RiskGauge score={report.riskScore} size={104} />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Sparkles size={11} className="text-ai-cyan" />
                        {t("impression", lang)}
                      </p>
                      <p className="text-sm text-slate-200 leading-relaxed">{report.impression}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                        {t("recommendation", lang)}
                      </p>
                      <p className="text-sm text-slate-300 leading-relaxed">{report.recommendation}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    {t("findings", lang)}
                  </p>
                  <div className="space-y-2">
                    {report.findings.map((f, i) => (
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
              </div>
            </>
          )}
        </div>
      </div>

      {alertReport && (
        <CriticalAlertModal report={alertReport} onDismiss={() => setAlertReport(null)} />
      )}
    </div>
  );
};