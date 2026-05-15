import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test";
import App from "./App";
import { createInitialProject, useProjectStore } from "./store/projectStore";

describe("App", () => {
  beforeEach(() => {
    useProjectStore.setState({
      activeFitTarget: "ups-vb-edge",
      project: createInitialProject(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  test("renders the analyzer workspace without loading demo data initially", async () => {
    render(<App />);
    expect(screen.getByText("UPS-LEIPS Analyzer")).toBeTruthy();
    expect(screen.getByText("UPS spectra analysis")).toBeTruthy();
    expect(screen.getByText("VB set")).toBeTruthy();
    expect(screen.getByText("IP set")).toBeTruthy();
    expect(screen.getAllByText("UPS VB").length).toBeGreaterThan(0);
    expect(screen.getAllByText("UPS IP").length).toBeGreaterThan(0);
    expect(await screen.findAllByText("UPS-LEIPS Band Diagram")).toHaveLength(1);
    expect(screen.getByLabelText("LEET / LEET(der) / LEIPS plot").dataset.xDirection).toBe(
      "normal",
    );
    expect(screen.getByRole("button", { name: "Band" })).toBeTruthy();
    expect(screen.getByText("0 datasets")).toBeTruthy();
    expect(screen.getAllByText("No data").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Demo" })).toBeNull();
    expect(screen.queryByText("GZIP")).toBeNull();
    expect(screen.queryByText("Import")).toBeNull();
    expect(screen.getAllByText("Load CSV data to render this plot.").length).toBeGreaterThan(0);
  });

  test("keeps the empty workspace interactive", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "LEIPS" }));
    expect(screen.getByText("LEIPS spectra analysis")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Fit" }));
    expect(screen.getByText("Cursor / fitting ranges")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Recalculate" }));
    expect(screen.getByText("0 datasets")).toBeTruthy();
    expect(screen.queryByText("Cannot fit an empty range.")).toBeNull();
  });

  test("shows project and plot context menus", async () => {
    const user = userEvent.setup();
    useProjectStore.getState().loadDemo();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Project" }));
    expect(screen.getByText("New Project")).toBeTruthy();
    expect(screen.getByText("Save Project")).toBeTruthy();
    expect(screen.getByText("Save as ...")).toBeTruthy();
    expect(screen.getByText("Recent project")).toBeTruthy();
    expect(screen.getByText("Export")).toBeTruthy();
    expect(screen.getAllByText("Import").length).toBeGreaterThan(0);
    expect(screen.getByText("Project list")).toBeTruthy();
    expect(screen.getByText("Delete project")).toBeTruthy();
    await user.click(screen.getByText("Save as ..."));
    expect(screen.getByRole("heading", { name: "Save as ..." })).toBeTruthy();
    expect(screen.getByText(/same name/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    fireEvent.pointerDown(document.body);
    await user.click(screen.getByRole("button", { name: "Project" }));
    await user.click(screen.getByText("Delete project"));
    expect(screen.getByRole("heading", { name: "Delete project" })).toBeTruthy();
    expect(screen.getByText(/return to an empty project/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    fireEvent.pointerDown(document.body);
    await user.click(screen.getByRole("button", { name: "Project" }));
    await user.click(screen.getByText("Project list"));
    expect(screen.getAllByText("Project List").length).toBeGreaterThan(0);
    expect(screen.getByText("Project name")).toBeTruthy();

    fireEvent.pointerDown(document.body);
    await user.click(screen.getByRole("button", { name: "Project" }));
    fireEvent.mouseEnter(screen.getByRole("button", { name: "View" }));
    expect(screen.getByText("Reset view")).toBeTruthy();
    expect(screen.queryByText("Save Project")).toBeNull();

    fireEvent.pointerDown(document.body);
    await user.click(screen.getByRole("button", { name: "Windows" }));
    expect(screen.getAllByText("Data Browser").length).toBeGreaterThan(1);
    fireEvent.pointerDown(document.body);
    await user.click(screen.getByRole("button", { name: "Help" }));
    expect(screen.getByText("About UPS-LEIPS Analyzer")).toBeTruthy();
    await user.click(screen.getByText("About UPS-LEIPS Analyzer"));
    expect(screen.getAllByText("UPS-LEIPS Analyzer").length).toBeGreaterThan(1);
    expect(screen.getByText(/Use the Project menu/)).toBeTruthy();

    expect(screen.queryByRole("button", { name: "Reset" })).toBeNull();
    expect(screen.queryByRole("button", { name: "PNG" })).toBeNull();
    expect(screen.queryByRole("button", { name: "SVG" })).toBeNull();

    fireEvent.contextMenu(screen.getByLabelText("UPS IP plot"));
    expect(screen.getByText("Reset view")).toBeTruthy();
    expect(screen.getByText("Export PNG")).toBeTruthy();
    expect(screen.getByText("Export SVG")).toBeTruthy();
    expect(screen.getByText("Save VBM view")).toBeTruthy();
    expect(screen.getByText("Recall Cut-off view")).toBeTruthy();

    fireEvent.pointerDown(document.body);
    fireEvent.contextMenu(screen.getByLabelText("LEET / LEET(der) / LEIPS plot"));
    expect(screen.getByText("Filter")).toBeTruthy();
    expect(screen.getByText("Band pass 1_4.77 eV ✓")).toBeTruthy();
  });

  test("shows workspace context menu and removes active cursor badges", async () => {
    useProjectStore.getState().loadDemo();
    render(<App />);

    expect(screen.queryByText(/active/)).toBeNull();
    expect(screen.queryByLabelText("A cursor")).toBeNull();

    const plane = document.querySelector("[data-workspace-plane='true']") as HTMLElement;
    fireEvent.contextMenu(plane);
    expect(screen.getAllByText("Project").length).toBeGreaterThan(1);
    expect(screen.getAllByText("View").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Windows").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Help").length).toBeGreaterThan(1);
    expect(screen.queryByText("Load Demo")).toBeNull();
  });
});
