import { recalculateProject, touchProject } from "./projectModel";
import type { ProjectSnapshot, ProjectUiState } from "./projectTypes";

export function recalculateTouchedProject(project: ProjectSnapshot): ProjectSnapshot {
  return recalculateProject(touchProject(project));
}

export function touchProjectUi(
  project: ProjectSnapshot,
  patch: Partial<ProjectUiState>,
): ProjectSnapshot {
  return touchProject({
    ...project,
    ui: {
      ...project.ui,
      ...patch,
    },
  });
}
