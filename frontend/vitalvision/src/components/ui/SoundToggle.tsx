import React, { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isSoundEnabled, setSoundEnabled, playSuccess } from "../../lib/sound";
import { useLanguage } from "../../hooks/useLanguage";

export const SoundToggle: React.FC = () => {
  const { lang } = useLanguage();
  const [on, setOn] = useState<boolean>(() => isSoundEnabled());

  const toggle = () => {
    const next = !on;
    setSoundEnabled(next);
    setOn(next);
    if (next) playSuccess();
  };

  return (
    <button
      onClick={toggle}
      className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-navy-600 transition-colors"
      title={on ? (lang === "sq" ? "Çaktivizo zërin" : "Mute sounds") : (lang === "sq" ? "Aktivizo zërin" : "Enable sounds")}
    >
      {on ? <Volume2 size={13} /> : <VolumeX size={13} />}
      {on
        ? lang === "sq" ? "Zëri aktiv" : "Sound on"
        : lang === "sq" ? "Zëri i fikur" : "Sound off"}
    </button>
  );
};