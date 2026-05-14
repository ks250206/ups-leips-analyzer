import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import App from "./App";

describe("App", () => {
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
  });
});
