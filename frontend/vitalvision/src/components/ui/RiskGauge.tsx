import React, { useEffect, useRef, useState } from "react";
import type { RiskLevel } from "../../types";
import { useLanguage } from "../../hooks/useLanguage";
import { t } from "../../i18n";

interface RiskGaugeProps {
  score: number;
  size?: number;
  showLabel?: boolean;
  animate?: boolean;
}

const RISK_COLORS: Record<RiskLevel, string> = {
  low: "#10B981",
  medium: "#F59E0B",
  high: "#F97316",
  critical: "#EF4444",
};

function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  size = 120,
  showLabel = true,
  animate = true,
}) => {
  const { lang } = useLanguage();
  const level = getRiskLevel(score);
  const color = RISK_COLORS[level];
  const label = t(level, lang);

  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animate) return;

    const duration = 900;
    const start = performance.now();
    const fromScore = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(fromScore + eased * (score - fromScore)));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [score, animate]);

  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;
  const isCritical = level === "critical";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        {isCritical && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: `0 0 ${size * 0.2}px ${color}44`,
              animation: "pulse-glow 2s ease-in-out infinite",
            }}
          />
        )}
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#1A2740" strokeWidth="8" />
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "center",
              filter: isCritical ? `drop-shadow(0 0 4px ${color})` : "none",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono font-medium leading-none tabular-nums"
            style={{ fontSize: size * 0.22, color }}
          >
            {displayScore}
          </span>
          <span className="text-slate-400" style={{ fontSize: size * 0.1 }}>
            /100
          </span>
        </div>
      </div>
      {showLabel && (
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            background: `${color}22`,
            color,
            border: `1px solid ${color}44`,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};