# Iteration 034: D3 cursors, ranges, and markers

## Purpose

- Stabilize the D3 migration for fit range bands, cursor handles, and marker overlays.
- Keep cursor edits from resetting zoom state.

## Implemented

- Rendered range bands, marker lines, marker labels, and cursor handles in the same SVG coordinate system as axes and series.
- Cursor handle drag now updates only the target fit range through `onRangeBandChange`; it does not touch the local zoom viewport.
- Added `rangeAfterCursorDrag` as a pure helper and covered cursor min/max normalization in tests.

## TODO

- Browser-check cursor drag behavior after the zoom/export iteration.
- Tune label collision and marker placement after the D3 visual baseline is stable.

## Simplifications / Technical Debt

- Cursor handle labels remain compact `A`/`B` style labels; Igor-like marker typography can be refined later.

## Verification

- Passed: `vp check`
- Passed: `vp test --coverage`
  - 8 files passed, 48 tests passed.
  - Coverage: statements 97.3%, branches 84.14%, functions 98.57%, lines 97.27%.
- Passed: `vp build`
