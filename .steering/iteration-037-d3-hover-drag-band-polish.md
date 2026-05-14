# Iteration 037: D3 hover, drag, and Band Diagram polish

## Purpose

- Reduce residual hover-driven plot movement after SVG migration.
- Make fit range overlays lighter.
- Make drag zoom mode selection less eager to become X/Y-only zoom.
- Repair Band Diagram plot area balance and large-number tick readability.

## Implemented

- Stabilized plot sizing:
  - `ResizeObserver` now updates React size state only when width/height actually changed.
  - Plot host uses layout/paint/size containment to isolate hover effects from surrounding layout.
- Lightened selection visuals:
  - Range band fill alpha lowered from `0.11` to `0.055`.
  - Active drag selection fill alpha lowered.
- Changed drag zoom mode detection:
  - X-only and Y-only zoom now require a much stronger aspect dominance.
  - Broad rectangular drags remain XY zoom unless the gesture is almost horizontal or almost vertical.
- Band Diagram cleanup:
  - Large-axis plot margins were reduced to restore more actual plot area.
  - Large-axis label sizes were reduced slightly to avoid crowding.
- Added SVG tick labels for large values using mantissa plus superscript exponent, e.g. `2.0×10` with the exponent rendered as superscript.

## TODO

- If hover movement is still visible on a specific handle or browser zoom setting, capture the exact handle and window coordinates and add a targeted browser regression.
- Add proper Band Diagram annotation arrows for `IP`, `EA`, and `Eg` in a later visual iteration.

## Simplifications / Technical Debt

- Hover stability is handled by eliminating likely layout feedback paths; the visual confirmation was performed manually in the in-app browser.

## Verification

- Passed: `vp check`
- Passed: `vp test --coverage`
  - 8 files passed, 51 tests passed.
  - Coverage: statements 97.3%, branches 84.14%, functions 98.57%, lines 97.27%.
- Passed: `vp build`
- Passed: `pnpm binary:build`
- Browser check on `http://localhost:5173/`:
  - Demo data loaded.
  - Hovering multiple cursor handles did not change the screenshot in the automated check.
