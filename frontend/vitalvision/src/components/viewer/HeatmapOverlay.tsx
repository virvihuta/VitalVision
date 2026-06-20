import React, { useState } from "react";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import type { Finding } from "../../types";
import { ensureBoxes } from "../../lib/regionMap";
import { useLanguage } from "../../hooks/useLanguage";

interface HeatmapOverlayProps {
  imageDataUrl: string;
  findings: Finding[];
  activeFindingIndex: number | null;
  onZoneClick: (index: number) => void;
  height?: number;
}

const SEVERITY_COLOR: Record<Finding["severity"], string> = {
  normal: "#10B981",
  mild: "#FBBF24",
  moderate: "#F59E0B",
  severe: "#EF4444",
};

export const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({
  imageDataUrl,
  findings,
  activeFindingIndex,
  onZoneClick,
  height = 360,
}) => {
  const { lang } = useLanguage();
  const [showOverlay, setShowOverlay] = useState(true);
  const boxed = ensureBoxes(findings);
  const abnormal = boxed.filter((f) => f.severity !== "normal");

  return (
    <div className="bg-navy-800 border border-navy-600 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-navy-700">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-ai-cyan" />
          <p className="text-xs font-medium text-slate-300">
            {lang === "sq" ? "Pamje AI me Shënime" : "AI Annotated View"}
          </p>
          <span className="text-[10px] text-slate-500 font-mono">
            {abnormal.length} {lang === "sq" ? "zona" : "zones"}
          </span>
        </div>
        <button
          onClick={() => setShowOverlay((v) => !v)}
          className="flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-navy-700 text-slate-300 hover:bg-navy-600 transition-colors"
        >
          {showOverlay ? <Eye size={12} /> : <EyeOff size={12} />}
          {showOverlay
            ? lang === "sq" ? "Shfaq" : "Visible"
            : lang === "sq" ? "Fshehur" : "Hidden"}
        </button>
      </div>

      <div
        className="relative bg-navy-950 flex items-center justify-center overflow-hidden"
        style={{ height }}
      >
        <img
          src={imageDataUrl}
          alt="Medical scan"
          className="max-h-full max-w-full object-contain"
        />

        {showOverlay && (
          <div className="absolute inset-0 pointer-events-none">
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {boxed.map((f, i) => {
                if (f.severity === "normal") return null;
                const color = SEVERITY_COLOR[f.severity];
                const active = activeFindingIndex === i;
                const { x, y, w, h } = f.bbox;
                const rx = (x - w / 2) * 100;
                const ry = (y - h / 2) * 100;
                const rw = w * 100;
                const rh = h * 100;
                return (
                  <g key={i} style={{ pointerEvents: "auto", cursor: "pointer" }}>
                    <rect
                      x={rx - 1}
                      y={ry - 1}
                      width={rw + 2}
                      height={rh + 2}
                      rx="1"
                      fill={color}
                      opacity={active ? 0.18 : 0.08}
                      style={{
                        transition: "opacity 0.25s ease",
                        filter: `blur(1px)`,
                      }}
                    />
                    <rect
                      x={rx}
                      y={ry}
                      width={rw}
                      height={rh}
                      rx="0.6"
                      fill={color}
                      fillOpacity={active ? 0.18 : 0.08}
                      stroke={color}
                      strokeWidth={active ? "0.5" : "0.3"}
                      strokeDasharray={active ? "0" : "1 0.6"}
                      vectorEffect="non-scaling-stroke"
                      onClick={() => onZoneClick(i)}
                      style={{
                        transition: "all 0.25s ease",
                        filter: active ? `drop-shadow(0 0 4px ${color})` : "none",
                      }}
                    >
                      {active && (
                        <animate
                          attributeName="stroke-opacity"
                          values="1;0.4;1"
                          dur="1.4s"
                          repeatCount="indefinite"
                        />
                      )}
                    </rect>
                    <circle
                      cx={rx + rw}
                      cy={ry}
                      r="1.6"
                      fill={color}
                      stroke="#070D1A"
                      strokeWidth="0.3"
                      vectorEffect="non-scaling-stroke"
                    />
                    <text
                      x={rx + rw}
                      y={ry + 0.5}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="2"
                      fontWeight="600"
                      fill="#070D1A"
                      style={{ pointerEvents: "none", fontFamily: "JetBrains Mono, monospace" }}
                    >
                      {i + 1}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {showOverlay && abnormal.length > 0 && (
          <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1.5 pointer-events-none">
            {abnormal.slice(0, 4).map((f) => {
              const realIdx = boxed.indexOf(f);
              const color = SEVERITY_COLOR[f.severity];
              const active = activeFindingIndex === realIdx;
              return (
                <div
                  key={realIdx}
                  className="text-[10px] px-1.5 py-0.5 rounded-md font-medium backdrop-blur-sm transition-opacity"
                  style={{
                    background: `${color}25`,
                    color,
                    border: `1px solid ${color}55`,
                    opacity: active ? 1 : 0.75,
                  }}
                >
                  {realIdx + 1}. {f.region}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-600 text-center py-1.5 border-t border-navy-700">
        {lang === "sq"
          ? "Kliko një zonë ose gjetje për të lidhur"
          : "Click a zone or finding to link"}
      </p>
    </div>
  );
};