import { createContext, useContext, useState, useEffect } from "react";
import type { Language } from "../types";

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType>({
  lang: "sq",
  setLang: () => {},
});

export const useLanguage = () => useContext(LanguageContext);

export function useLanguageState() {
  const [lang, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem("vv-lang");
    return (stored === "en" || stored === "sq") ? stored : "sq";
  });

  useEffect(() => {
    localStorage.setItem("vv-lang", lang);
  }, [lang]);

  return { lang, setLang: setLangState };
}