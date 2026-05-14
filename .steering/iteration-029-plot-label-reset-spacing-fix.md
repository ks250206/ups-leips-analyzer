# Iteration 029: Plot label, reset, and spacing fix

## Purpose

- Properly remove dotted plot-frame artifacts.
- Restore visible vertical axis labels.
- Restore double-click zoom reset.
- Correct the top-row margin reduction to half of the original gap.

## Implemented

- Added CSS overrides to remove uPlot dashed cursor crosshair borders.
- Added explicit overlay labels for left and right Y axes so labels remain visible regardless of uPlot axis layout.
- Added double-click reset on the plot area.
- Changed top-row default window `y` from `46` to `26`, matching half of the original `52` gap.

## TODO

- Consider adding a small visible hint for double-click reset in a toolbar tooltip.

## Simplifications / Technical Debt

- Y-axis labels are now rendered as React overlays instead of relying only on uPlot's axis label renderer.

## Verification

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
