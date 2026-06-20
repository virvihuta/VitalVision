import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { RadiologistView } from "./components/views/RadiologistView";
import { DepartmentView } from "./components/views/DepartmentView";
import { AlertsView } from "./components/views/AlertsView";
import { OpsView } from "./components/views/OpsView";
import { ToastProvider, useToast } from "./components/ui/Toast";
import { CriticalAlertModal } from "./components/ui/CriticalAlertModal";
import { DemoModeController } from "./components/ui/DemoModeController";
import { LanguageContext, useLanguageState, useLanguage } from "./hooks/useLanguage";
import { usePACS } from "./hooks/usePACS";
import { useCurrentUser } from "./hooks/useCurrentUser";
import { archiveStudy } from "./api/backendApi";
import { DEMO_REPORT } from "./lib/demoMode";
import { t } from "./i18n";
import type { UserRole, DiagnosticReport } from "./types";

function AppContent() {
  const { lang } = useLanguage();
  const { showToast } = useToast();
  const [role, setRole] = useState<UserRole>("radiologist");
  const [activeView, setActiveView] = useState<string>("analyze");
  const { unreadCount, refetch } = usePACS();
  const currentUser = useCurrentUser(role);

  const [demoRunning, setDemoRunning] = useState(false);
  const [demoAlertReport, setDemoAlertReport] = useState<DiagnosticReport | null>(null);

  const handleDemoStep = useCallback(
    (action: string) => {
      switch (action) {
        case "showRadiologist":
          setRole("radiologist");
          setActiveView("analyze");
          break;
        case "showAnalysis":
          setRole("radiologist");
          setActiveView("analyze");
          break;
        case "showHeatmap":
          break;
        case "fireAlert": {
          const demo = { ...DEMO_REPORT, id: `RPT-DEMO-${Date.now()}`, archivedAt: new Date().toISOString() };
          archiveStudy(
            {
              patientName: demo.patientName,
              patientId: demo.patientId,
              personalNumber: demo.personalNumber,
              patientAge: demo.patientAge,
              sex: "",
              modality: demo.modality,
              bodyPart: demo.bodyPart,
              clinicalNotes: "",
              radiologistName: demo.radiologistName,
              imageDataUrl: demo.imageDataUrl,
            },
            {
              riskScore: demo.riskScore,
              riskLevel: demo.riskLevel,
              findings: demo.findings,
              impression: demo.impression,
              recommendation: demo.recommendation,
              department: demo.department,
            }
          ).then(() => refetch()).catch(() => {});
          setDemoAlertReport(demo);
          break;
        }
        case "showDoctor":
          setDemoAlertReport(null);
          setRole("doctor");
          setActiveView("alerts");
          break;
        case "showOps":
          setRole("ops");
          setActiveView("dashboard");
          break;
      }
    },
    [refetch]
  );

  const handleDemoComplete = useCallback(() => {
    setDemoRunning(false);
    showToast(t("demoComplete", lang), "success");
  }, [lang, showToast]);

  const handleDemoToggle = useCallback(() => {
    setDemoRunning((r) => !r);
    setDemoAlertReport(null);
  }, []);

  // Clean up the demo alert if demo stops mid-flight
  useEffect(() => {
    if (demoRunning) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDemoAlertReport((prev) => (prev ? null : prev));
  }, [demoRunning]);

  const renderView = () => {
    if (activeView === "analyze") return <RadiologistView />;
    if (activeView === "search") return <DepartmentView />;
    if (activeView === "archive") return <DepartmentView />;
    if (activeView === "alerts") return <AlertsView />;
    if (activeView === "dashboard") return <OpsView />;
    return <RadiologistView />;
  };

  return (
    <div className="flex min-h-screen bg-navy-950">
      <Sidebar
        role={role}
        onRoleChange={setRole}
        activeView={activeView}
        onViewChange={setActiveView}
        unreadAlerts={unreadCount}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar user={currentUser} />
        <main className="flex-1">{renderView()}</main>
      </div>

      <DemoModeController
        onStep={handleDemoStep}
        onComplete={handleDemoComplete}
        running={demoRunning}
        onToggle={handleDemoToggle}
      />

      {demoAlertReport && (
        <CriticalAlertModal
          report={demoAlertReport}
          onDismiss={() => setDemoAlertReport(null)}
        />
      )}
    </div>
  );
}

function App() {
  const langState = useLanguageState();

  return (
    <LanguageContext.Provider value={langState}>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </LanguageContext.Provider>
  );
}

export default App;