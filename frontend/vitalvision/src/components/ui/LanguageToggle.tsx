import React from "react";
import { useLanguage } from "../../hooks/useLanguage";

export const LanguageToggle: React.FC = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-navy-700 rounded-lg p-0.5 border border-navy-500">
      <button
        onClick={() => setLang("sq")}
        className={`flex-1 text-xs font-medium py-1 rounded transition-colors ${
          lang === "sq"
            ? "bg-clinical-blue text-white"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        SQ
      </button>
      <button
        onClick={() => setLang("en")}
        className={`flex-1 text-xs font-medium py-1 rounded transition-colors ${
          lang === "en"
            ? "bg-clinical-blue text-white"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        EN
      </button>
    </div>
  );
};