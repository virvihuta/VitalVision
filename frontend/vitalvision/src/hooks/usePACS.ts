import { useCallback, useEffect, useState } from "react";
import { pacsStore } from "../lib/pacsStore";
import {
  getStudies,
  getAlerts,
  getStats,
  type Stats,
} from "../api/backendApi";
import type { DiagnosticReport, Alert } from "../types";

interface ViewStats {
  total: number;
  critical: number;
  avgRisk: number;
  byModality: Record<string, number>;
}

const EMPTY_STATS: ViewStats = { total: 0, critical: 0, avgRisk: 0, byModality: {} };

function toViewStats(s: Stats): ViewStats {
  return {
    total: s.totalStudies,
    critical: s.highRiskCases,
    avgRisk: s.averageRiskScore,
    byModality: s.modalityBreakdown,
  };
}

function reportToAlert(r: DiagnosticReport): Alert {
  return {
    id: r.id,
    reportId: r.id,
    patientName: r.patientName,
    riskScore: r.riskScore,
    riskLevel: r.riskLevel,
    modality: r.modality,
    targetDepartments: r.department ?? [],
    createdAt: r.archivedAt,
    read: pacsStore.isAlertRead(r.id),
  };
}

export function usePACS() {
  const [reports, setReports] = useState<DiagnosticReport[]>([]);
  const [alertReports, setAlertReports] = useState<DiagnosticReport[]>([]);
  const [stats, setStats] = useState<ViewStats>(EMPTY_STATS);
  const [readVersion, setReadVersion] = useState(0);

  const refetch = useCallback(async () => {
    try {
      const [r, a, s] = await Promise.all([getStudies(), getAlerts(), getStats()]);
      setReports(r);
      setAlertReports(a);
      setStats(toViewStats(s));
    } catch {
      // Backend not reachable yet — leave whatever we have.
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const unsub = pacsStore.subscribe(() => setReadVersion((v) => v + 1));
    return () => { unsub(); };
  }, []);

  const alerts: Alert[] = alertReports.map(reportToAlert);
  // readVersion intentionally drives a re-derive when mark-read fires
  void readVersion;
  const unreadCount = alerts.filter((a) => !a.read).length;

  return { reports, alerts, unreadCount, stats, refetch };
}
