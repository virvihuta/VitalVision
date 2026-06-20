import { useMemo } from "react";
import type { CurrentUser, UserRole } from "../types";

// Placeholder users until Aiden's /me endpoint is live.
// Swap this hook to call /me with the token from localStorage when ready.
const MOCK_USERS: Record<UserRole, CurrentUser> = {
  radiologist: { id: "u_001", name: "Dr. Erion Basha", role: "radiologist", hospital: "QSUT" },
  doctor: { id: "u_002", name: "Dr. Arta Koci", role: "doctor", hospital: "QSUT" },
  ops: { id: "u_003", name: "Admin", role: "ops", hospital: "QSUT" },
};

export function useCurrentUser(role: UserRole): CurrentUser {
  return useMemo(() => MOCK_USERS[role], [role]);
}