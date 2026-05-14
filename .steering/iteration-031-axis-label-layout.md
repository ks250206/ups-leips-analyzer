# Iteration 031: Axis label layout

## Purpose

- Fix vertical axis label placement.
- Increase plot top padding so cursor labels and annotations have breathing room.
- Make Band Diagram axis labels closer to the supplied reference image scale.

## Implemented

- Removed React overlay Y-axis labels.
- Returned axis labels and ticks to uPlot as the single source of truth.
- Tuned uPlot `axis.size`, `labelSize`, `labelGap`, and `padding` for normal plots and Band Diagram.
- Increased plot top padding:
  - Normal plots: `52px`
  - Large axis label plots: `76px`
- Added `largeAxisLabels` mode to `SpectrumPlot`.
- Enabled `largeAxisLabels` for the Band Diagram.
- Verified in the in-app browser on `http://localhost:5173/`.

## TODO

- Add Band Diagram-specific annotation arrows and larger `IP`/`EA`/`Eg` labels as a separate visual iteration.

## Simplifications / Technical Debt

- Axis label typography is now controlled through uPlot options only.

## Verification

- Passed: `vp check`
- Passed: `vp test --coverage`
  - 8 files passed, 48 tests passed.
  - Coverage: statements 97.3%, branches 84.14%, functions 98.57%, lines 97.27%.
- Passed: `vp build`
- Passed: `pnpm binary:build`
- Browser check on `http://localhost:5173/` before the D3 migration decision.
