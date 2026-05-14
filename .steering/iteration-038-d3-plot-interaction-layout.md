# Iteration 038: D3 plot interaction and layout tuning

## Purpose

- Make Command/Ctrl wheel zoom act on the plot under the pointer instead of the whole workspace.
- Tighten D3 plot styling and plot window layout.
- Hide extrapolated fit lines when their fit cursor range is entirely outside the current X viewport.

## Implemented

- Plot wheel behavior:
  - Added a native non-passive `wheel` listener on the SVG so Command/Ctrl wheel can prevent browser/workspace zoom and zoom the plot domain.
  - Workspace wheel handling now ignores events originating from `[data-plot-host="true"]`.
- Fit line visibility:
  - `lineFitSeries` now records its original `fitRange`.
  - `SpectrumPlot` hides a fit series when the fit range is entirely outside the current visible X domain.
- Axis and visual tuning:
  - Removed grid lines.
  - Changed ticks to point inward.
  - Increased tick label size.
  - Reduced right-side plot margins, while keeping right-axis plots enough room for right labels.
  - Added more margin between exponent tick labels and the Y-axis label.
  - Moved `Reset` / `PNG` / `SVG` buttons upward and reduced their font size.
  - Reduced plot top margins.
- Layout:
  - Increased UPS and LEIPS plot window sizes and reduced the vertical gap between upper and lower plot rows in `defaultWindows`.

## TODO

- Verify the exact button/marker overlap on narrower user-resized windows and add a responsive collision rule if needed.
- Add richer Band Diagram annotation arrows and typography later.

## Simplifications / Technical Debt

- The current fit-line hiding rule is X-domain based. It hides the extrapolated line when both fit cursors are outside the visible X range on the same side.

## Verification

- Passed: `vp check --fix`
- Passed: `vp check`
- Passed: `vp test --coverage`
  - 8 files passed, 52 tests passed.
  - Coverage: statements 97.3%, branches 84.14%, functions 98.57%, lines 97.27%.
- Passed: `vp build`
- Passed: `pnpm binary:build`
- Browser check on `http://localhost:5173/`:
  - Demo data loaded.
  - Command+wheel over UPS VB zoomed the plot instead of the workspace.
