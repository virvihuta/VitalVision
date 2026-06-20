import React, { useEffect, useMemo, useState } from "react";
import { Bell, AlertTriangle, CheckCheck, Clock, ShieldCheck } from "lucide-react";
import { usePACS } from "../../hooks/usePACS";
import { pacsStore } from "../../lib/pacsStore";
import { RiskBadge } from "../ui/RiskBadge";
import { useToast } from "../ui/Toast";
import { useLanguage } from "../../hooks/useLanguage";
import { t } from "../../i18n";

export const AlertsView: React.FC = () => {
  const { lang } = useLanguage();
  const { alerts, unreadCount } = usePACS();
  const { showToast } = useToast();

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(() => Date.now());
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const sorted = useMemo(
    () =>
      [...alerts].sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [alerts]
  );

  const formatRelative = (iso: string) => {
    const diff = now - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return lang === "sq" ? "tani" : "just now";
    if (mins < 60) return lang === "sq" ? `${mins} min më parë` : `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return lang === "sq" ? `${hours} orë më parë` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return lang === "sq" ? `${days} ditë më parë` : `${days}d ago`;
  };

  const handleClick = (id: string) => {
    pacsStore.markAlertRead(id);
  };

  const markAllRead = () => {
    pacsStore.markAllAlertsRead();
    showToast(
      lang === "sq" ? "Të gjitha u shënuan si të lexuara" : "All marked as read",
      "success"
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-white">{t("alertsTitle", lang)}</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-mono px-2 py-0.5 rounded-full">
                {unreadCount} {lang === "sq" ? "të reja" : "new"}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">{t("alertsSubtitle", lang)}</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg bg-navy-700 border border-navy-500 text-slate-300 hover:bg-navy-600 transition-colors"
          >
            <CheckCheck size={14} />
            {t("markAllRead", lang)}
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="bg-navy-800/50 border border-navy-700 border-dashed rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={26} className="text-emerald-400" />
          </div>
          <p className="text-base font-medium text-slate-200 mb-1">
            {lang === "sq" ? "Gjithçka në rregull" : "All clear"}
          </p>
          <p className="text-sm text-slate-500">
            {lang === "sq"
              ? "Asnjë alert me prioritet të lartë në këtë moment. Smenë e mbarë."
              : "No high-priority alerts right now. Good shift."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((a) => {
            const isCritical = a.riskLevel === "critical";
            const accent = isCritical ? "#EF4444" : "#F97316";
            return (
              <button
                key={a.id}
                onClick={() => handleClick(a.id)}
                className={`w-full text-left bg-navy-800 border rounded-xl p-4 transition-colors ${
                  !a.read
                    ? "border-navy-500 hover:border-navy-400"
                    : "border-navy-700 opacity-70 hover:opacity-100"
                }`}
                style={!a.read ? { borderLeftWidth: 3, borderLeftColor: accent } : {}}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: `${accent}18`,
                      border: `1px solid ${accent}35`,
                    }}
                  >
                    <AlertTriangle size={15} style={{ color: accent }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {a.patientName}
                          {!a.read && (
                            <span
                              className="inline-block ml-2 w-1.5 h-1.5 rounded-full align-middle"
                              style={{ background: accent }}
                            />
                          )}
                        </p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {a.modality} · {t("risk", lang)} {a.riskScore}/100
                        </p>
                      </div>
                      <RiskBadge level={a.riskLevel} />
                    </div>

                    {a.targetDepartments.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-xs text-slate-500">{t("notified", lang)}</span>
                        {a.targetDepartments.map((d) => (
                          <span
                            key={d}
                            className="text-xs px-2 py-0.5 rounded-full bg-navy-700 text-slate-300 border border-navy-500"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2">
                      <Clock size={11} />
                      {formatRelative(a.createdAt)}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Hide unused bell import warning by referencing it once visually if empty */}
      <Bell size={0} className="hidden" />
    </div>
  );
};