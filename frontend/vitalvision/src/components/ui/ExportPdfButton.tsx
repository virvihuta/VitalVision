import React from "react";
import { FileDown } from "lucide-react";
import type { DiagnosticReport } from "../../types";
import { exportReportAsPdf } from "../../lib/reportPdf";
import { useLanguage } from "../../hooks/useLanguage";

interface ExportPdfButtonProps {
  report: DiagnosticReport;
  hospital: string;
  variant?: "primary" | "ghost";
}

export const ExportPdfButton: React.FC<ExportPdfButtonProps> = ({
  report,
  hospital,
  variant = "ghost",
}) => {
  const { lang } = useLanguage();

  const handleClick = () => {
    exportReportAsPdf(report, hospital, lang);
  };

  if (variant === "primary") {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-ai-gradient text-white hover:shadow-md hover:shadow-ai-violet/30 transition-shadow"
      >
        <FileDown size={13} />
        {lang === "sq" ? "Eksporto PDF" : "Export PDF"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-navy-700 border border-navy-500 hover:bg-navy-600 transition-colors"
    >
      <FileDown size={12} />
      {lang === "sq" ? "Eksporto PDF" : "Export PDF"}
    </button>
  );
};