# Iteration 028: Plot frame, axis label, and top spacing

## Purpose

- Remove dotted plot-frame artifacts.
- Restore left-axis labels.
- Reduce the gap between the top toolbar and the first row of windows.

## Implemented

- Disabled uPlot cursor crosshair display to remove dashed cursor lines around plot frames.
- Changed range band borders from dashed to solid.
- Enlarged left-axis reserved space and explicitly set axis label size/gap.
- Reduced top-row default window `y` from `52` to `46`.
- Added regression expectations for cursor hiding and left-axis label sizing.

## TODO

- If users need cursor crosshair readout later, reintroduce it as a non-dashed custom overlay.

## Simplifications / Technical Debt

- Existing saved project layouts are not migrated; this changes the default layout for fresh/demo project creation.

## Verification

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
