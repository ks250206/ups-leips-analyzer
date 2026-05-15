import type { ProjectSnapshot } from "./projectTypes";
import { touchProject } from "./projectModel";

export function toggleUtilityWindow(
  project: ProjectSnapshot,
  kind: "help" | "projects",
  title: string,
  x: number,
  y: number,
  width: number,
  height: number,
): { project: ProjectSnapshot } {
  const existing = project.windows.find((window) => window.id === kind);
  if (existing) {
    return {
      project: touchProject({
        ...project,
        windows: project.windows.filter((window) => window.id !== kind),
      }),
    };
  }
  const nextZ = Math.max(...project.windows.map((window) => window.zIndex)) + 1;
  return {
    project: touchProject({
      ...project,
      windows: [...project.windows, { id: kind, title, kind, x, y, width, height, zIndex: nextZ }],
    }),
  };
}
