import { useEffect, useRef } from "react";
import { readLastOpenedWorkspace, writeLastOpenedWorkspace } from "../../store/lastOpenedWorkspace";
import type { LastOpenedWorkspaceRef } from "../../store/lastOpenedWorkspace";

export function useLastOpenedWorkspaceRestore({
  onRestoreFailed,
  onRestoreSucceeded,
  resetToDefaultEmptyWorkspace,
  restoreLastOpenedWorkspace,
  setLastOpenedRestored,
}: {
  onRestoreFailed: (caught: unknown) => void;
  onRestoreSucceeded: () => void;
  resetToDefaultEmptyWorkspace: () => Promise<void>;
  restoreLastOpenedWorkspace: (ref: LastOpenedWorkspaceRef) => Promise<void>;
  setLastOpenedRestored: (restored: boolean) => void;
}) {
  const restoreStartedRef = useRef(false);
  useEffect(() => {
    if (restoreStartedRef.current) {
      return;
    }
    restoreStartedRef.current = true;
    const ref = readLastOpenedWorkspace();
    if (!ref) {
      setLastOpenedRestored(true);
      return;
    }
    void restoreLastOpenedWorkspace(ref)
      .then(onRestoreSucceeded)
      .catch((caught: unknown) => {
        return resetToDefaultEmptyWorkspace().then(() => onRestoreFailed(caught));
      })
      .finally(() => setLastOpenedRestored(true));
  }, [
    onRestoreFailed,
    onRestoreSucceeded,
    resetToDefaultEmptyWorkspace,
    restoreLastOpenedWorkspace,
    setLastOpenedRestored,
  ]);
}

export function useLastOpenedWorkspaceWriter({
  activeCatalogId,
  isProjectUnsaved,
  lastOpenedRestored,
  projectId,
}: {
  activeCatalogId: string;
  isProjectUnsaved: boolean;
  lastOpenedRestored: boolean;
  projectId: string;
}) {
  useEffect(() => {
    if (!lastOpenedRestored) {
      return;
    }
    writeLastOpenedWorkspace({
      catalogId: activeCatalogId,
      projectId: isProjectUnsaved ? undefined : projectId,
    });
  }, [activeCatalogId, isProjectUnsaved, lastOpenedRestored, projectId]);
}
