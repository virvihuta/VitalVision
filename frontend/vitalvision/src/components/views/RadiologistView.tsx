import React, { useState, useRef } from "react";
import { Upload, Sparkles, Loader2, ShieldCheck, X, FileImage } from "lucide-react";
import type { DiagnosticReport, Modality } from "../../types";
import { analyzeImage, archiveStudy } from "../../api/backendApi";
import { usePACS } from "../../hooks/usePACS";
import { RiskGauge } from "../ui/RiskGauge";
import { RiskBadge } from "../ui/RiskBadge";
import { CriticalAlertModal } from "../ui/CriticalAlertModal";
import { ExportPdfButton } from "../ui/ExportPdfButton";
import { ImageViewer3D } from "../viewer/ImageViewer3D";
import { HeatmapOverlay } from "../viewer/HeatmapOverlay";
import { useToast } from "../ui/Toast";
import { useLanguage } from "../../hooks/useLanguage";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { playSuccess, playCritical } from "../../lib/sound";
import { t, localizeBodyPart, fmtAge } from "../../i18n";

const MODALITIES: Modality[] = ["X-Ray", "CT", "MRI", "Ultrasound"];

const BODY_PARTS: { value: string; labelKey: import("../../i18n").TranslationKey }[] = [
  { value: "Chest", labelKey: "bpChest" },
  { value: "Abdomen", labelKey: "bpAbdomen" },
  { value: "Head / Brain", labelKey: "bpHeadBrain" },
  { value: "Spine", labelKey: "bpSpine" },
  { value: "Pelvis", labelKey: "bpPelvis" },
  { value: "Extremities (Upper)", labelKey: "bpUpperExtremities" },
  { value: "Extremities (Lower)", labelKey: "bpLowerExtremities" },
  { value: "Neck", labelKey: "bpNeck" },
  { value: "Cardiac", labelKey: "bpCardiac" },
  { value: "Full Body", labelKey: "bpFullBody" },
];

type Status = "idle" | "analyzing" | "done" | "error";

export const RadiologistView: React.FC = () => {
  const { lang } = useLanguage();
  const { showToast } = useToast();
  const { refetch } = usePACS();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user: currentUser } = useCurrentUser();

  const [patientName, setPatientName] = useState("");
  const [personalNumber, setPersonalNumber] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [modality, setModality] = useState<Modality>("X-Ray");
  const [bodyPart, setBodyPart] = useState("Chest");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [archived, setArchived] = useState(false);
  const [alertReport, setAlertReport] = useState<DiagnosticReport | null>(null);
  const [activeFinding, setActiveFinding] = useState<number | null>(null);

  const PERSONAL_NUMBER_RE = /^[A-Z]\d{8}[A-Z]$/;
  const personalNumberValid = PERSONAL_NUMBER_RE.test(personalNumber);
  const personalNumberError = personalNumber.length > 0 && !personalNumberValid;
  const canAnalyze =
    patientName.trim() &&
    patientAge.trim() &&
    bodyPart.trim() &&
    personalNumberValid &&
    imageDataUrl;

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
        bodyPart,
        lang,
        personalNumber
      );
      const newReport: DiagnosticReport = {
        id: `RPT-${Date.now()}`,
        patientId: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
        patientName,
        personalNumber,
        patientAge: parseInt(patientAge, 10),
        modality,
        bodyPart,
        imageDataUrl,
        riskScore: result.riskScore ?? 0,
        riskLevel: result.riskLevel ?? "LOW",
        findings: result.findings ?? [],
        impression: result.impression ?? "",
        recommendation: result.recommendation ?? "",
        archivedAt: new Date().toISOString(),
        radiologistName: currentUser?.name ?? "—",
        department: result.department ?? [],
        status: "analyzed",
      };
      setReport(newReport);
      setStatus("done");
      playSuccess();
      showToast(lang === "sq" ? "Analiza përfundoi" : "Analysis complete", "success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Analysis failed");
      showToast(lang === "sq" ? "Analiza dështoi" : "Analysis failed", "error");
    }
  };

  const archiveReport = async () => {
    if (!report) return;
    try {
      await archiveStudy(
        {
          patientName: report.patientName,
          patientId: report.patientId,
          personalNumber: report.personalNumber,
          patientAge: report.patientAge,
          sex: "",
          modality: report.modality,
          bodyPart: report.bodyPart,
          clinicalNotes: "",
          radiologistName: report.radiologistName,
          imageDataUrl: report.imageDataUrl,
        },
        {
          riskScore: report.riskScore,
          riskLevel: report.riskLevel,
          findings: report.findings,
          impression: report.impression,
          recommendation: report.recommendation,
          department: report.department,
        }
      );
      setArchived(true);
      await refetch();
      showToast(t("studyArchived", lang), "success");
      if (report.riskScore >= 75) {
        setAlertReport(report);
        playCritical();
      } else {
        playSuccess();
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Archive failed", "error");
    }
  };

  const reset = () => {
    setPatientName("");
    setPersonalNumber("");
    setPatientAge("");
    setBodyPart("Chest");
    setImageDataUrl(null);
    setStatus("idle");
    setReport(null);
    setArchived(false);
    setErrorMsg("");
    setActiveFinding(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleFinding = (i: number) => {
    setActiveFinding((prev) => (prev === i ? null : i));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">{t("uploadTitle", lang)}</h1>
        <p className="text-sm text-slate-400 mt-1">{t("uploadSubtitle", lang)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
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
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                {t("personalNumber", lang)}
              </label>
              <input
                type="text"
                placeholder={t("personalNumberPlaceholder", lang)}
                value={personalNumber}
                onChange={(e) => setPersonalNumber(e.target.value.toUpperCase())}
                disabled={status === "analyzing" || status === "done"}
                aria-label={t("personalNumber", lang)}
                aria-invalid={personalNumberError}
                maxLength={10}
                className={`w-full bg-navy-700 border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none disabled:opacity-60 font-mono tracking-wide ${
                  personalNumberError
                    ? "border-red-500 focus:border-red-400"
                    : "border-navy-500 focus:border-ai-cyan"
                }`}
              />
              {personalNumberError && (
                <p className="text-xs text-red-400 mt-1">
                  {t("personalNumberInvalid", lang)}
                </p>
              )}
            </div>
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
            <select
              value={bodyPart}
              onChange={(e) => setBodyPart(e.target.value)}
              disabled={status === "analyzing" || status === "done"}
              aria-label={t("bodyPart", lang)}
              title={t("bodyPart", lang)}
              className="w-full bg-navy-700 border border-navy-500 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-ai-cyan disabled:opacity-60"
            >
              {BODY_PARTS.map((bp) => (
                <option key={bp.value} value={bp.value}>{t(bp.labelKey, lang)}</option>
              ))}
            </select>
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
                alt={t("altMedicalScan", lang)}
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

        <div className="lg:col-span-3 space-y-4">
          {!report ? (
            <div className="h-full min-h-96 bg-navy-800/50 border border-navy-700 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-ai-gradient-soft flex items-center justify-center">
                <Sparkles size={20} className="text-ai-cyan" />
              </div>
              <div>
                <p className="text-sm text-slate-300 font-medium">
                  {lang === "sq" ? "Gati për analizë" : "Ready for analysis"}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  {lang === "sq"
                    ? "Plotëso të dhënat e pacientit dhe ngarko një imazh për të nisur."
                    : "Fill in the patient info and upload an image to begin."}
                </p>
              </div>
            </div>
          ) : (
            <>
              {imageDataUrl && (
                <HeatmapOverlay
                  imageDataUrl={imageDataUrl}
                  findings={report.findings}
                  activeFindingIndex={activeFinding}
                  onZoneClick={toggleFinding}
                  height={340}
                />
              )}

              {imageDataUrl && <ImageViewer3D imageDataUrl={imageDataUrl} height={280} />}

              <div className="bg-navy-800 border border-navy-600 rounded-xl p-5">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <p className="text-white font-semibold">{report.patientName}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {report.patientId} · {fmtAge(report.patientAge, lang)} · {report.modality} — {localizeBodyPart(report.bodyPart, lang)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ExportPdfButton report={report} hospital={currentUser?.hospital ?? ""} />
                    <RiskBadge level={report.riskLevel} />
                  </div>
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
                    {report.findings.map((f, i) => {
                      const active = activeFinding === i;
                      const isAbnormal = f.severity !== "normal";
                      return (
                        <button
                          key={i}
                          onClick={() => toggleFinding(i)}
                          className={`w-full text-left flex items-start gap-3 rounded-lg px-3 py-2.5 transition-all ${
                            active
                              ? "bg-navy-600 border border-ai-cyan/60"
                              : "bg-navy-700 border border-navy-500 hover:border-navy-400"
                          }`}
                        >
                          {isAbnormal ? (
                            <span
                              className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-semibold flex-shrink-0 ${
                                f.severity === "severe"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                                  : f.severity === "moderate"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                                  : "bg-orange-400/20 text-orange-300 border border-orange-400/40"
                              }`}
                            >
                              {i + 1}
                            </span>
                          ) : (
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-200 font-medium">{f.region}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{f.description}</p>
                          </div>
                        </button>
                      );
                    })}
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