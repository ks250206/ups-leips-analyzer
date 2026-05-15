import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test";
import App from "./App";
import { createInitialProject, useProjectStore } from "./store/projectStore";
import { useToastStore } from "./ui/Toast";

const CSV = `2
no area description
VB
1,1
file#
6.0,16
5.9,15
5.8,14
`;

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    useProjectStore.setState({
      activeFitTarget: "ups-vb-edge",
      project: createInitialProject(),
    });
    useToastStore.setState({ messages: [] });
  });

  afterEach(() => {
    cleanup();
  });

  test("renders the analyzer workspace without loading demo data initially", async () => {
    render(<App />);
    expect(screen.getByText("UPS-LEIPS Analyzer")).toBeTruthy();
    expect(screen.getByText("Datasets")).toBeTruthy();
    expect(screen.getAllByText("UPS VB").length).toBeGreaterThan(0);
    expect(screen.getAllByText("UPS IP").length).toBeGreaterThan(0);
    expect(screen.getAllByText("REELS Plot").length).toBeGreaterThan(0);
    expect(await screen.findAllByText("UPS-LEIPS Band Diagram")).toHaveLength(1);
    expect(screen.getByLabelText("LEET / LEET(der) / LEIPS plot").dataset.xDirection).toBe(
      "normal",
    );
    expect(screen.getByLabelText("REELS plot").dataset.xDirection).toBe("reverse");
    expect(screen.getByRole("button", { name: "Band" })).toBeTruthy();
    expect(screen.getByText("0 datasets")).toBeTruthy();
    expect(screen.getAllByText("No data").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Demo" })).toBeNull();
    expect(screen.queryByText("GZIP")).toBeNull();
    expect(screen.queryByText("Import")).toBeNull();
    expect(screen.getByText("Load CSVs")).toBeTruthy();
    expect(screen.getByText("Dropdown file field for MultiPak CSVs.")).toBeTruthy();
    expect(screen.getAllByText("Load CSV data to render this plot.").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Load CSVs/ })).toBeTruthy();
  });

  test("shows a toast after loading CSV datasets", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.upload(
      screen.getByLabelText("Load CSV files"),
      new File([CSV], "toast_UPS_VB.csv", { type: "text/csv" }),
    );

    expect(await screen.findByText("Loaded 1 dataset.")).toBeTruthy();
    expect(screen.getAllByText("toast_UPS_VB").length).toBeGreaterThan(0);
  });

  test("keeps the empty workspace interactive", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "LEIPS" }));
    expect(screen.getByText("LEIPS spectra analysis")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "REELS" }));
    expect(screen.getByText("REELS analysis")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Fit" }));
    expect(screen.getByText("Cursor / fitting ranges")).toBeTruthy();

    expect(screen.getByText("Zoom 100%")).toBeTruthy();
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
    expect(screen.getByText("Load Project")).toBeTruthy();
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
    await user.click(screen.getByText("Load Project"));
    expect(screen.getByRole("heading", { name: "Load Project" })).toBeTruthy();
    expect(screen.getAllByText("Project name").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    fireEvent.pointerDown(document.body);
    await user.click(screen.getByRole("button", { name: "Project" }));
    fireEvent.mouseEnter(screen.getByRole("button", { name: "View" }));
    expect(screen.getByText("Reset view")).toBeTruthy();
    expect(screen.queryByText("Save Project")).toBeNull();

    fireEvent.pointerDown(document.body);
    await user.click(screen.getByRole("button", { name: "Windows" }));
    expect(screen.getAllByText("Data Browser").length).toBeGreaterThan(1);
    expect(screen.getByText("Reset all window positions")).toBeTruthy();
    expect(screen.getByText("Reset all window sizes")).toBeTruthy();
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
    expect(screen.getByText("Hide cursor ranges")).toBeTruthy();
    expect(screen.getAllByLabelText("A cursor").length).toBeGreaterThan(0);
    expect(screen.getByText("Cursor style")).toBeTruthy();
    expect(screen.getByText("Reset view")).toBeTruthy();
    expect(screen.getByText("Copy PNG")).toBeTruthy();
    expect(screen.getByText("Export PNG")).toBeTruthy();
    expect(screen.getByText("Export SVG")).toBeTruthy();
    expect(screen.getByText("Save VBM view")).toBeTruthy();
    expect(screen.getByText("Recall Cut-off view")).toBeTruthy();
    fireEvent.mouseEnter(screen.getByText("Cursor style"));
    await user.click(screen.getByText("Range cursor"));
    expect(useProjectStore.getState().project.ui?.cursorStyles?.upsIp).toBe("range");
    expect(useProjectStore.getState().project.ui?.cursorStyles?.leips).toBeUndefined();

    fireEvent.pointerDown(document.body);
    fireEvent.contextMenu(screen.getByLabelText("REELS plot"));
    expect(screen.getByText("REELS BG mode")).toBeTruthy();
    fireEvent.mouseEnter(screen.getByText("REELS BG mode"));
    await user.click(screen.getByText("Single point y=const"));
    expect(screen.getByLabelText("BG single point cursor")).toBeTruthy();

    fireEvent.pointerDown(document.body);
    fireEvent.contextMenu(screen.getByLabelText("LEET / LEET(der) / LEIPS plot"));
    expect(screen.getByText("Filter")).toBeTruthy();
    fireEvent.mouseEnter(screen.getByText("Filter"));
    expect(screen.getByText("1_4.77 eV ✓")).toBeTruthy();
    await user.click(screen.getByText("Custom"));
    expect(screen.getByRole("heading", { name: "Custom band pass" })).toBeTruthy();
    expect(screen.getAllByText(/Eg=/).length).toBeGreaterThan(0);
  });

  test("focuses analysis tabs from related plot windows", async () => {
    useProjectStore.getState().loadDemo();
    render(<App />);

    expect(screen.getByText("Datasets")).toBeTruthy();
    fireEvent.pointerDown(screen.getByText(/UPS VB -/));
    expect(await screen.findByText("UPS spectra analysis")).toBeTruthy();

    fireEvent.pointerDown(screen.getByText(/LEIPS Plot -/));
    expect(await screen.findByText("LEIPS spectra analysis")).toBeTruthy();

    fireEvent.pointerDown(screen.getByText(/REELS Plot -/));
    expect(await screen.findByText("REELS analysis")).toBeTruthy();
  });

  test("shows workspace context menu and removes active cursor badges", async () => {
    useProjectStore.getState().loadDemo();
    render(<App />);

    expect(screen.queryByText(/active/)).toBeNull();
    expect(screen.getAllByLabelText("A cursor").length).toBeGreaterThan(0);

    const plane = document.querySelector("[data-workspace-plane='true']") as HTMLElement;
    fireEvent.contextMenu(plane);
    expect(screen.getAllByText("Project").length).toBeGreaterThan(1);
    expect(screen.getAllByText("View").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Windows").length).toBeGreaterThan(1);
    expect(screen.queryByText("Setting")).toBeNull();
    expect(screen.getAllByText("Help").length).toBeGreaterThan(1);
    expect(screen.queryByText("Load Demo")).toBeNull();
  });

  test("shows sample info fields and cancels load project from backdrop", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Sample Info" }));
    expect(screen.getAllByText("Sample Info").length).toBeGreaterThan(1);
    await user.type(screen.getByLabelText("組成(仕込)"), "Li6PS5Cl");
    expect(screen.getByDisplayValue("Li, P, S, Cl")).toBeTruthy();
    expect(screen.getByLabelText("試料台")).toBeTruthy();
    expect(screen.getByText("LEIPS測定対応傾斜試料ホルダ_MOD201")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Project" }));
    await user.click(screen.getByText("Load Project"));
    expect(screen.getByRole("heading", { name: "Load Project" })).toBeTruthy();
    fireEvent.pointerDown(screen.getByTestId("modal-backdrop"));
    expect(screen.queryByRole("heading", { name: "Load Project" })).toBeNull();
  });
});
