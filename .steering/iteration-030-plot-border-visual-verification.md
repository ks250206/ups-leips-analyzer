# Iteration 030: Plot border visual verification

## Purpose

- Fix the plot border still appearing dashed after the previous iteration.
- Confirm the fix in the in-app browser.
- Keep drag-zoom selection visible while removing only the unwanted dashed cursor lines.

## Implemented

- Reset the canvas line dash before drawing the plot-area border.
- Kept the uPlot selection rectangle visible for drag zoom.
- Hid only uPlot cursor crosshair DOM lines.
- Verified in the in-app browser that:
  - Plot frame is solid.
  - Left Y-axis label is visible.
  - Double-clicking the plot does not error and reset handling is active.

## TODO

- Add a Playwright visual smoke test once browser automation is stable enough for canvas pixel checks.

## Simplifications / Technical Debt

- Visual verification is currently manual/browser-assisted rather than screenshot-diff based.

## Verification

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- Browser check on `http://localhost:5173/`
