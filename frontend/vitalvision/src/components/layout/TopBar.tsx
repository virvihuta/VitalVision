import React, { useEffect, useState } from "react";
import { Activity, Building2, ChevronDown } from "lucide-react";
import type { CurrentUser } from "../../types";
import { generateEvent, type ActivityEvent } from "../../lib/activityFeed";
import { useLanguage } from "../../hooks/useLanguage";
import { t } from "../../i18n";

interface TopBarProps {
  user: CurrentUser;
}

const TYPE_COLOR: Record<ActivityEvent["type"], string> = {
  archived: "#22D3EE",
  alert: "#EF4444",
  viewed: "#94A3B8",
  analyzed: "#A855F7",
  login: "#10B981",
};

export const TopBar: React.FC<TopBarProps> = ({ user }) => {
  const { lang } = useLanguage();

  const [clock, setClock] = useState(() => new Date());

  const [feed, setFeed] = useState<ActivityEvent[]>(() => {
    const now = Date.now();
    return Array.from({ length: 6 }, (_, i) => generateEvent(now - i * 12000));
  });

  const [currentIdx, setCurrentIdx] = useState(0);

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setClock(() => new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Add a new event every 7 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setFeed((prev) => {
        const next = generateEvent(Date.now());
        return [next, ...prev].slice(0, 15);
      });
      setCurrentIdx(() => 0);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  // Rotate through visible items in the ticker
  useEffect(() => {
    if (feed.length === 0) return;
    const id = setInterval(() => {
      setCurrentIdx((i) => (i + 1) % Math.min(feed.length, 5));
    }, 3500);
    return () => clearInterval(id);
  }, [feed.length]);

  const formatClock = (d: Date) =>
    d.toLocaleTimeString(lang === "sq" ? "sq-AL" : "en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const formatDate = (d: Date) =>
    d.toLocaleDateString(lang === "sq" ? "sq-AL" : "en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });

  const formatRel = (ts: number) => {
    const diff = Math.floor((clock.getTime() - ts) / 1000);
    if (diff < 5) return lang === "sq" ? "tani" : "now";
    if (diff < 60) return `${diff}s`;
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h`;
  };

  const visible = feed[currentIdx];

  return (
    <header className="h-14 bg-navy-900/80 backdrop-blur-md border-b border-navy-600 sticky top-0 z-30 flex items-center px-5 gap-4">
      {/* Hospital */}
      <div className="flex items-center gap-2 min-w-0">
        <Building2 size={14} className="text-slate-500 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-300 truncate leading-none">
            {user.hospital === "QSUT"
              ? "Qendra Spitalore Universitare Tiranë"
              : user.hospital}
          </p>
          <p className="text-[10px] text-slate-500 font-mono leading-none mt-0.5">
            VitalVision · v1.0
          </p>
        </div>
      </div>

      <div className="w-px h-7 bg-navy-600 flex-shrink-0" />

      {/* Live activity ticker */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 font-medium flex-shrink-0">
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative rounded-full w-1.5 h-1.5 bg-emerald-400" />
          </span>
          {t("liveActivity", lang)}
        </span>
        <div className="flex-1 min-w-0 overflow-hidden">
          {visible && (
            <div
              key={visible.id}
              className="flex items-center gap-2 text-xs whitespace-nowrap animate-overlay-in"
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: TYPE_COLOR[visible.type] }}
              />
              <span className="text-slate-300 truncate">
                <span className="text-slate-400">{visible.actor}</span>
                {" — "}
                {visible.detail}
              </span>
              <span className="text-slate-600 font-mono text-[10px] flex-shrink-0">
                {formatRel(visible.timestamp)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="w-px h-7 bg-navy-600 flex-shrink-0" />

      {/* Clock */}
      <div className="hidden md:flex flex-col items-end flex-shrink-0">
        <span className="text-xs font-mono text-slate-300 tabular-nums leading-none">
          {formatClock(clock)}
        </span>
        <span className="text-[10px] text-slate-500 leading-none mt-0.5">
          {formatDate(clock)}
        </span>
      </div>

      <div className="w-px h-7 bg-navy-600 flex-shrink-0 hidden md:block" />

      {/* System status */}
      <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 flex-shrink-0">
        <Activity size={12} className="text-emerald-400" />
        {t("systemOnline", lang)}
      </div>

      {/* User */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-7 h-7 rounded-full bg-ai-gradient flex items-center justify-center text-[10px] font-semibold text-white">
          {user.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
        </div>
        <div className="hidden sm:block">
          <p className="text-xs font-medium text-slate-200 leading-none">{user.name}</p>
          <p className="text-[10px] text-slate-500 leading-none mt-0.5 capitalize">{user.role}</p>
        </div>
        <ChevronDown size={12} className="text-slate-500" />
      </div>
    </header>
  );
};