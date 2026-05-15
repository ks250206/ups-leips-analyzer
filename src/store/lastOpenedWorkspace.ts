export interface LastOpenedWorkspaceRef {
  catalogId: string;
  projectId?: string;
}

export const LAST_OPENED_WORKSPACE_KEY = "ups-leips:last-opened-workspace";

export function readLastOpenedWorkspace(): LastOpenedWorkspaceRef | undefined {
  try {
    if (typeof localStorage === "undefined") {
      return undefined;
    }
    const raw = localStorage.getItem(LAST_OPENED_WORKSPACE_KEY);
    if (!raw) {
      return undefined;
    }
    const parsed = JSON.parse(raw) as Partial<LastOpenedWorkspaceRef>;
    return typeof parsed.catalogId === "string" && parsed.catalogId.length > 0
      ? { catalogId: parsed.catalogId, projectId: parsed.projectId }
      : undefined;
  } catch {
    return undefined;
  }
}

export function writeLastOpenedWorkspace(ref: LastOpenedWorkspaceRef): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LAST_OPENED_WORKSPACE_KEY, JSON.stringify(ref));
    }
  } catch {
    // LocalStorage persistence is best-effort only.
  }
}

export function clearLastOpenedWorkspace(): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(LAST_OPENED_WORKSPACE_KEY);
    }
  } catch {
    // LocalStorage persistence is best-effort only.
  }
}
