import React, { useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useLanguage } from "../../hooks/useLanguage";
import { t } from "../../i18n";

type Tab = "login" | "register";

const BG = "#0f1117";
const PANEL = "#161922";
const BORDER = "#252836";
const ACCENT = "#00d4aa";
const TEXT = "#e2e8f0";
const MUTED = "#94a3b8";
const DIM = "#64748b";

const inputBase: React.CSSProperties = {
  width: "100%",
  background: "#0b0d14",
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  color: TEXT,
  outline: "none",
};

interface LangSwitchProps {
  lang: "sq" | "en";
  setLang: (l: "sq" | "en") => void;
}

const LangSwitch: React.FC<LangSwitchProps> = ({ lang, setLang }) => {
  const pill = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "8px 18px",
    minWidth: 56,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1.2,
    border: "none",
    borderRadius: 999,
    cursor: "pointer",
    background: active ? ACCENT : "transparent",
    color: active ? "#06121a" : MUTED,
    transition: "background 180ms, color 180ms, transform 180ms",
    transform: active ? "scale(1)" : "scale(0.97)",
    boxShadow: active ? "0 4px 14px rgba(0,212,170,0.35)" : "none",
  });
  return (
    <div
      role="group"
      aria-label="Language"
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: 4,
        background: "rgba(15,17,23,0.6)",
        border: `1px solid ${BORDER}`,
        borderRadius: 999,
        backdropFilter: "blur(6px)",
      }}
    >
      <button onClick={() => setLang("sq")} style={pill(lang === "sq")} aria-pressed={lang === "sq"}>
        AL
      </button>
      <button onClick={() => setLang("en")} style={pill(lang === "en")} aria-pressed={lang === "en"}>
        EN
      </button>
    </div>
  );
};

export const LoginView: React.FC = () => {
  const { lang, setLang } = useLanguage();
  const { login, register } = useCurrentUser();

  const [tab, setTab] = useState<Tab>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [name, setName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        /401|invalid email or password/i.test(msg)
          ? t("invalidCredentials", lang)
          : t("genericError", lang)
      );
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(name.trim(), regEmail.trim(), regPassword, inviteCode.trim().toUpperCase());
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        /invalid invite code/i.test(msg)
          ? t("invalidInviteCode", lang)
          : t("genericError", lang)
      );
    } finally {
      setBusy(false);
    }
  };

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "10px 0",
    background: "transparent",
    border: "none",
    borderBottom: `2px solid ${active ? ACCENT : "transparent"}`,
    color: active ? TEXT : MUTED,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "color 150ms, border-color 150ms",
  });

  const submitBtn: React.CSSProperties = {
    width: "100%",
    padding: "11px 0",
    borderRadius: 8,
    background: ACCENT,
    color: "#06121a",
    fontSize: 14,
    fontWeight: 600,
    border: "none",
    cursor: busy ? "wait" : "pointer",
    opacity: busy ? 0.7 : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        color: TEXT,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
          <LangSwitch lang={lang} setLang={setLang} />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${ACCENT}, #22d3ee)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 8px 24px ${ACCENT}33`,
            }}
          >
            <Activity size={20} color="#06121a" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: 0.3 }}>VitalVision</div>
            <div style={{ fontSize: 11, color: DIM, marginTop: 1 }}>{t("appTagline", lang)}</div>
          </div>
        </div>

        <div
          style={{
            background: PANEL,
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "20px 24px 4px" }}>
            <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{t("loginTitle", lang)}</h1>
            <p style={{ fontSize: 13, color: MUTED, margin: "4px 0 0" }}>
              {t("loginSubtitle", lang)}
            </p>
          </div>

          <div style={{ display: "flex", padding: "12px 24px 0", gap: 16, borderBottom: `1px solid ${BORDER}` }}>
            <button onClick={() => { setTab("login"); setError(""); }} style={tabBtnStyle(tab === "login")}>
              {t("login", lang)}
            </button>
            <button onClick={() => { setTab("register"); setError(""); }} style={tabBtnStyle(tab === "register")}>
              {t("register", lang)}
            </button>
          </div>

          <div style={{ padding: "20px 24px 24px" }}>
            {tab === "login" ? (
              <form onSubmit={submitLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 4 }}>
                    {t("email", lang)}
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputBase}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 4 }}>
                    {t("password", lang)}
                  </label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={inputBase}
                  />
                </div>
                {error && (
                  <div style={{ fontSize: 12, color: "#f87171", padding: "6px 0" }}>{error}</div>
                )}
                <button type="submit" disabled={busy} style={submitBtn}>
                  {busy && <Loader2 size={14} className="animate-spin" />}
                  {t("signIn", lang)}
                </button>
              </form>
            ) : (
              <form onSubmit={submitRegister} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 4 }}>
                    {t("name", lang)}
                  </label>
                  <input
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={inputBase}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 4 }}>
                    {t("email", lang)}
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    style={inputBase}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 4 }}>
                    {t("password", lang)}
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    style={inputBase}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 4 }}>
                    {t("inviteCode", lang)}
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder={t("inviteCodePlaceholder", lang)}
                    style={{ ...inputBase, fontFamily: "ui-monospace, monospace", letterSpacing: 1 }}
                  />
                  <p style={{ fontSize: 11, color: DIM, margin: "4px 0 0" }}>
                    {t("inviteHelper", lang)}
                  </p>
                </div>
                {error && (
                  <div style={{ fontSize: 12, color: "#f87171", padding: "6px 0" }}>{error}</div>
                )}
                <button type="submit" disabled={busy} style={submitBtn}>
                  {busy && <Loader2 size={14} className="animate-spin" />}
                  {t("createAccount", lang)}
                </button>
              </form>
            )}
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            background: PANEL,
            border: `1px dashed ${BORDER}`,
            borderRadius: 12,
            padding: "12px 16px",
            fontSize: 11,
            color: MUTED,
            fontFamily: "ui-monospace, monospace",
          }}
        >
          <div style={{ color: ACCENT, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            {t("demoCredsLabel", lang)}
          </div>
          <div>{t("demoCredsRadiologist", lang)}</div>
          <div>{t("demoCredsDoctor", lang)}</div>
          <div>{t("demoCredsOps", lang)}</div>
        </div>
      </div>
    </div>
  );
};
