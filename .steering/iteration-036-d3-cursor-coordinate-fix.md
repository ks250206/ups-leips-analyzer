# Iteration 036: D3 cursor coordinate fix

## Purpose

- Fix cursor handle dragging after the D3 migration.
- Prevent reversible plot layout shifts when hovering cursor handles.

## Implemented

- Fixed coordinate conversion for D3 interactions:
  - Pointer events produce plot-relative coordinates.
  - D3 scales use absolute SVG coordinates.
  - Added `plotXToValue`, `plotYToValue`, and `plotY2ToValue` helpers to bridge that offset explicitly.
- Updated cursor handle drag, Shift-drag fit range selection, drag zoom, and pointer-centered wheel zoom to use the corrected coordinate conversion.
- Changed the SVG to `absolute inset-0` inside an `overflow-hidden` plot host so SVG intrinsic sizing cannot perturb the window layout on hover.
- Added regression coverage for plot-relative to scale-value conversion in normal and reversed X-axis modes.

## TODO

- Continue visual tuning for D3 label placement and Band Diagram annotation typography.

## Simplifications / Technical Debt

- Hover stability was verified by screenshot equality in the in-app browser rather than a committed visual regression test.

## Verification

- Passed: `vp check --fix`
- Passed: `vp check`
- Passed: `vp test --coverage`
  - 8 files passed, 50 tests passed.
  - Coverage: statements 97.3%, branches 84.14%, functions 98.57%, lines 97.27%.
- Passed: `vp build`
- Passed: `pnpm binary:build`
- Browser check on `http://localhost:5173/`:
  - Demo data loaded.
  - Hovering a cursor handle produced the same screenshot before/after.
  - Dragging an UPS IP cursor handle updated the target range without jumping left.
  - Browser console error log was empty.
