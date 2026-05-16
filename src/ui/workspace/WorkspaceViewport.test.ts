import { describe, expect, test } from "vite-plus/test";
import { viewportCenteredOnWindow } from "./WorkspaceViewport";

describe("workspace viewport", () => {
  test("centers a target window while preserving scale", () => {
    const viewport = viewportCenteredOnWindow(
      { x: 0, y: 0, scale: 1 },
      { x: 100, y: 200, width: 300, height: 100 },
      { width: 1000, height: 800 },
    );

    expect(viewport).toEqual({ x: 250, y: 150, scale: 1 });
  });

  test("centers a target window at non-default scale", () => {
    const viewport = viewportCenteredOnWindow(
      { x: -20, y: 40, scale: 1.5 },
      { x: 100, y: 200, width: 300, height: 100 },
      { width: 1000, height: 800 },
    );

    expect(viewport).toEqual({ x: 125, y: 25, scale: 1.5 });
  });
});
