import { defaultWindows } from "./projectFactory";
import { touchProject } from "./projectModel";
import type { ProjectStore } from "./projectStoreTypes";
import type { ProjectStoreGet, ProjectStoreSet } from "./projectStoreSliceTypes";
import { toggleUtilityWindow } from "./windowModel";

type WindowActions = Pick<
  ProjectStore,
  | "updateWindow"
  | "focusWindow"
  | "resetWindowPosition"
  | "resetWindowSize"
  | "resetAllWindowPositions"
  | "resetAllWindowSizes"
  | "toggleHelpWindow"
  | "toggleProjectsWindow"
>;

export function createProjectStoreWindowActions(
  set: ProjectStoreSet,
  _get: ProjectStoreGet,
): WindowActions {
  return {
    updateWindow: (id, patch) => {
      set((state) => ({
        project: touchProject({
          ...state.project,
          windows: state.project.windows.map((window) =>
            window.id === id ? { ...window, ...patch } : window,
          ),
        }),
      }));
    },
    focusWindow: (id) => {
      set((state) => {
        const nextZ = Math.max(...state.project.windows.map((window) => window.zIndex)) + 1;
        const target = state.project.windows.find((window) => window.id === id);
        if (!target || target.zIndex === nextZ - 1) {
          return state;
        }
        return {
          project: touchProject({
            ...state.project,
            windows: state.project.windows.map((window) =>
              window.id === id ? { ...window, zIndex: nextZ } : window,
            ),
          }),
        };
      });
    },
    resetWindowPosition: (id) => {
      set((state) => {
        const defaults = defaultWindows();
        return {
          project: touchProject({
            ...state.project,
            windows: state.project.windows.map((window) => {
              const defaultWindow = defaults.find((item) => item.id === window.id);
              return window.id === id && defaultWindow
                ? { ...window, x: defaultWindow.x, y: defaultWindow.y }
                : window;
            }),
          }),
        };
      });
    },
    resetWindowSize: (id) => {
      set((state) => {
        const defaults = defaultWindows();
        return {
          project: touchProject({
            ...state.project,
            windows: state.project.windows.map((window) => {
              const defaultWindow = defaults.find((item) => item.id === window.id);
              return window.id === id && defaultWindow
                ? { ...window, width: defaultWindow.width, height: defaultWindow.height }
                : window;
            }),
          }),
        };
      });
    },
    resetAllWindowPositions: () => {
      set((state) => {
        const defaults = defaultWindows();
        return {
          project: touchProject({
            ...state.project,
            windows: state.project.windows.map((window) => {
              const defaultWindow = defaults.find((item) => item.id === window.id);
              return defaultWindow ? { ...window, x: defaultWindow.x, y: defaultWindow.y } : window;
            }),
          }),
        };
      });
    },
    resetAllWindowSizes: () => {
      set((state) => {
        const defaults = defaultWindows();
        return {
          project: touchProject({
            ...state.project,
            windows: state.project.windows.map((window) => {
              const defaultWindow = defaults.find((item) => item.id === window.id);
              return defaultWindow
                ? { ...window, width: defaultWindow.width, height: defaultWindow.height }
                : window;
            }),
          }),
        };
      });
    },
    toggleHelpWindow: () => {
      set((state) => {
        const hasHelp = state.project.windows.some((window) => window.id === "help");
        if (hasHelp) {
          return {
            project: touchProject({
              ...state.project,
              windows: state.project.windows.filter((window) => window.id !== "help"),
            }),
          };
        }
        const nextZ = Math.max(...state.project.windows.map((window) => window.zIndex)) + 1;
        const controlsWindow = state.project.windows.find((window) => window.id === "controls");
        const helpX = controlsWindow?.x ?? 1448;
        const helpY = controlsWindow ? controlsWindow.y + controlsWindow.height + 18 : 646;
        const helpWidth = Math.max(controlsWindow?.width ?? 560, 520);
        return {
          project: touchProject({
            ...state.project,
            windows: [
              ...state.project.windows,
              {
                id: "help",
                title: "Help",
                kind: "help",
                x: helpX,
                y: helpY,
                width: helpWidth,
                height: 560,
                zIndex: nextZ,
              },
            ],
          }),
        };
      });
    },
    toggleProjectsWindow: () => {
      set((state) =>
        toggleUtilityWindow(state.project, "projects", "Project List", 1120, 116, 520, 420),
      );
    },
  };
}
