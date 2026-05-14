# Iteration 040: Plot wheel and pan controls

## Purpose

- Remap plot mouse-wheel gestures to zoom-first behavior.
- Add Alt-drag panning inside plots.
- Let Band Diagram scale/offset controls change by hovering and using the mouse wheel.

## Implemented

- Plot wheel behavior:
  - Normal wheel zooms the Y axis around the pointer.
  - Shift + wheel zooms the X axis around the pointer.
  - Alt + wheel pans the Y axis.
  - Alt + Shift + wheel pans the X axis.
- Plot drag behavior:
  - Alt + drag pans the current plot viewport.
  - Existing normal drag zoom and Shift-drag fit range selection are preserved.
- Band Diagram controls:
  - `UPS×`, `UPS+`, `LEIPS×`, and `LEIPS+` controls now respond to hover-state wheel changes.
  - Shift + wheel on those controls uses a larger step.
- Added unit coverage for wheel gesture mapping.

## TODO

- Fine tune wheel sensitivity after longer real-data use.
- If trackpad horizontal deltas are important, add a separate `deltaX` path for two-finger horizontal gestures.

## Simplifications / Technical Debt

- Alt-drag pan is local plot state only and is not persisted in Project JSON.

## Verification

- Passed: `vp check --fix`
- Passed: `vp check`
- Passed: `vp test --coverage`
  - 8 files passed, 54 tests passed.
  - Coverage: statements 97.3%, branches 84.14%, functions 98.57%, lines 97.27%.
- Passed: `vp build`
- Passed: `pnpm binary:build`
- Browser check on `http://localhost:5173/`:
  - Demo data loaded.
  - Normal wheel and Shift-wheel over UPS VB changed the plot viewport.
  - Alt-drag panned the UPS VB plot.
  - Wheel over the Band Diagram `UPS×` control changed its value.
