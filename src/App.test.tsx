import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import App from "./App";

describe("App", () => {
  test("renders the analyzer workspace with demo results", async () => {
    render(<App />);
    expect(screen.getByText("UPS-LEIPS Analyzer")).toBeTruthy();
    expect(screen.getByText("UPS spectra analysis")).toBeTruthy();
    expect(screen.getAllByText("UPS VB").length).toBeGreaterThan(0);
    expect(screen.getAllByText("UPS IP").length).toBeGreaterThan(0);
    expect(await screen.findAllByText("UPS-LEIPS Band Diagram")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Band" })).toBeTruthy();
  });
});
