import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import App from "./App";

describe("App", () => {
  test("renders the analyzer workspace with demo results", async () => {
    render(<App />);
    expect(screen.getByText("UPS-LEIPS Analyzer")).toBeTruthy();
    expect(screen.getByText("UPS spectra analysis")).toBeTruthy();
    expect(await screen.findByText("UPS-LEIPS graph")).toBeTruthy();
  });
});
