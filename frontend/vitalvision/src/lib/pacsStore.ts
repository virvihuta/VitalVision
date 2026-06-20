// Local-only state. Persistent data (reports, alerts, stats) lives on the
// backend now — read it through usePACS / src/api/backendApi.ts.
// The store only tracks which alert IDs the current user has marked read,
// since the backend has no /alerts/read endpoint.

class PACSStore {
  private readAlertIds: Set<string> = new Set();
  private listeners: Set<() => void> = new Set();

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  isAlertRead(id: string): boolean {
    return this.readAlertIds.has(id);
  }

  markAlertRead(id: string): void {
    if (this.readAlertIds.has(id)) return;
    this.readAlertIds.add(id);
    this.notify();
  }

  markAllAlertsRead(ids: string[]): void {
    let changed = false;
    for (const id of ids) {
      if (!this.readAlertIds.has(id)) {
        this.readAlertIds.add(id);
        changed = true;
      }
    }
    if (changed) this.notify();
  }
}

export const pacsStore = new PACSStore();
