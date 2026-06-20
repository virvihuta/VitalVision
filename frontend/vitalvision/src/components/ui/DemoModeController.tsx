import React, { useEffect, useRef, useState } from "react";
import { Square, Sparkles, ChevronRight } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";
import { t } from "../../i18n";
import { DEMO_SCRIPT, type DemoStep } from "../../lib/demoMode";

interface DemoModeControllerProps {
  onStep: (action: string) => void;
  onComplete: () => void;
  running: boolean;
  onToggle: () => void;
}

export const DemoModeController: React.FC<DemoModeControllerProps> = ({
  onStep,
  onComplete,
  running,
  onToggle,
}) => {
  const { lang } = useLanguage();
  const [stepIdx, setStepIdx] = useState(-1);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStepIdx(-1);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    let cancelled = false;
    let i = 0;

    const runStep = () => {
      if (cancelled) return;
      if (i >= DEMO_SCRIPT.length) {
        onComplete();
        return;
      }
      const step = DEMO_SCRIPT[i];
      setStepIdx(i);
      onStep(step.action);
      timeoutRef.current = window.setTimeout(() => {
        i++;
        runStep();
      }, step.duration);
    };

    runStep();

    return () => {
      cancelled = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [running, onStep, onComplete]);

  if (!running) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-ai-gradient text-white text-sm font-medium shadow-2xl shadow-ai-violet/30 hover:scale-105 transition-transform"
      >
        <Sparkles size={14} />
        {t("startDemo", lang)}
      </button>
    );
  }

  const currentStep: DemoStep | undefined = DEMO_SCRIPT[stepIdx];

  return (
    <div className="fixed bottom-5 right-5 z-40 w-80 bg-navy-800 border border-ai-violet/40 rounded-2xl shadow-2xl shadow-ai-violet/30 overflow-hidden">
      <div className="bg-ai-gradient px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Sparkles size={14} />
          <p className="text-xs font-semibold uppercase tracking-wider">{t("demoMode", lang)}</p>
        </div>
        <button
          onClick={onToggle}
          className="text-white/80 hover:text-white transition-colors text-xs flex items-center gap-1"
        >
          <Square size={11} fill="currentColor" />
          {t("stopDemo", lang)}
        </button>
      </div>

      <div className="p-4">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
          {t("runningDemo", lang)} · {Math.max(stepIdx + 1, 1)}/{DEMO_SCRIPT.length}
        </p>

        <div className="space-y-1.5">
          {DEMO_SCRIPT.map((step, i) => {
            const done = i < stepIdx;
            const active = i === stepIdx;
            return (
              <div
                key={i}
                className={`flex items-center gap-2 text-xs transition-all ${
                  active
                    ? "text-white font-medium"
                    : done
                    ? "text-slate-500 line-through"
                    : "text-slate-600"
                }`}
              >
                {active ? (
                  <ChevronRight size={12} className="text-ai-cyan flex-shrink-0" />
                ) : done ? (
                  <span className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/60 flex-shrink-0" />
                ) : (
                  <span className="w-3 h-3 rounded-full bg-navy-600 border border-navy-500 flex-shrink-0" />
                )}
                <span className="truncate">{t(step.labelKey, lang)}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 h-1 bg-navy-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-ai-gradient transition-all duration-500"
            style={{ width: `${((stepIdx + 1) / DEMO_SCRIPT.length) * 100}%` }}
          />
        </div>

        {currentStep && (
          <p className="text-[10px] text-ai-cyan mt-2 font-mono">
            → {currentStep.action}
          </p>
        )}
      </div>
    </div>
  );
};