import type { WindowLayout } from "../../store/projectTypes";
import type { AnalysisControlTab } from "./WorkspaceWindows";

export function tabForWindowKind(
  kind: WindowLayout["kind"] | undefined,
): AnalysisControlTab | undefined {
  switch (kind) {
    case "ups":
    case "ups-vb":
    case "ups-ip":
    case "ups-bias":
      return "ups";
    case "leips":
    case "leips-evac":
      return "leips";
    case "reels":
      return "reels";
    case "band":
      return "band";
    case "browser":
    case "table":
      return "data";
    default:
      return undefined;
  }
}
