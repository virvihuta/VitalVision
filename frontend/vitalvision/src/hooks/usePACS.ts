import { useState, useEffect } from "react";
import { pacsStore } from "../lib/pacsStore";
import type { DiagnosticReport, Alert } from "../types";

export function usePACS() {
  const [reports, setReports] = useState<DiagnosticReport[]>(pacsStore.getReports());
  const [alerts, setAlerts] = useState<Alert[]>(pacsStore.getAlerts());
  const [unreadCount, setUnreadCount] = useState(pacsStore.getUnreadAlertCount());

  useEffect(() => {
    const unsub = pacsStore.subscribe(() => {
      setReports(pacsStore.getReports());
      setAlerts(pacsStore.getAlerts());
      setUnreadCount(pacsStore.getUnreadAlertCount());
    });
    return () => { unsub(); };
  }, []);

  return { reports, alerts, unreadCount, stats: pacsStore.getStats() };
}