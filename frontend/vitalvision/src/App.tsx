import { useMemo, useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { RadiologistView } from "./components/views/RadiologistView";
import { DepartmentView } from "./components/views/DepartmentView";
import { AlertsView } from "./components/views/AlertsView";
import { OpsView } from "./components/views/OpsView";
import { PACSView } from "./components/views/PACSView";
import { LoginView } from "./components/views/LoginView";
import { ToastProvider } from "./components/ui/Toast";
import { LanguageContext, useLanguageState } from "./hooks/useLanguage";
import { usePACS } from "./hooks/usePACS";
import { useCurrentUser } from "./hooks/useCurrentUser";
import type { UserRole } from "./types";

const DEFAULT_VIEW: Record<UserRole, string> = {
  radiologist: "analyze",
  department_doctor: "search",
  ops: "dashboard",
};

function AuthedApp({ role }: { role: UserRole }) {
  const { user, logout } = useCurrentUser();
  const [activeView, setActiveView] = useState<string>(DEFAULT_VIEW[role]);
  const { unreadCount } = usePACS();

  const renderView = () => {
    if (activeView === "pacs") return <PACSView />;
    if (activeView === "analyze" && role === "radiologist") return <RadiologistView />;
    if ((activeView === "search" || activeView === "archive") && role === "department_doctor") return <DepartmentView />;
    if (activeView === "alerts") return <AlertsView />;
    if (activeView === "dashboard" && role === "ops") return <OpsView />;
    // Fallback to a view the role has access to.
    if (role === "radiologist") return <RadiologistView />;
    if (role === "department_doctor") return <DepartmentView />;
    return <OpsView />;
  };

  return (
    <div className="flex min-h-screen bg-navy-950">
      <Sidebar
        role={role}
        activeView={activeView}
        onViewChange={setActiveView}
        unreadAlerts={unreadCount}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar user={user!} onLogout={logout} />
        <main className="flex-1">{renderView()}</main>
      </div>
    </div>
  );
}

function AppContent() {
  const { user } = useCurrentUser();
  const role = useMemo<UserRole | null>(() => user?.role ?? null, [user]);

  if (!user || !role) return <LoginView />;
  return <AuthedApp role={role} />;
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
