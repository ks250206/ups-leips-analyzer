# Iteration 039: Range drag, IP snapshots, and Band controls

## Purpose

- Allow dragging the filled fit range band to shift both cursors together.
- Move default UPS IP EVBM and LEIPS Evac fit ranges toward the lower-energy side.
- Add quick IP zoom snapshots for EVBM and cut-off regions.
- Add Band Diagram controls for independent UPS/LEIPS Y scaling and X viewport selection.

## Implemented

- Range band dragging:
  - Dragging the filled band now shifts the whole range without changing its width.
  - Added `shiftRangeByDelta` unit coverage.
- Default fit ranges:
  - UPS IP EVBM edge moved lower-energy than before while preserving a stable demo IP fit.
  - UPS IP EVBM background moved further lower-energy.
  - LEIPS Evac edge/background defaults moved toward lower-energy regions.
  - Imported LEIPS Evac auto-range fallback now picks lower-energy background and onset ranges.
- IP plot snapshots:
  - Added `Save V` / `VBM` and `Save C` / `Cut` toolbar controls.
  - The save buttons store the current plot viewport; recall buttons restore it.
  - Recall falls back to the relevant fit ranges when a snapshot has not been saved yet.
- Band Diagram controls:
  - Added UPS and LEIPS independent scale and offset inputs.
  - Added X min/max inputs and an apply button to set the Band Diagram X viewport.
- `SpectrumPlot` viewport support:
  - Added `viewportRequest` to allow parent windows to recall zoom states.
  - Added `onViewportChange` so parent windows can save the current viewport.
  - Added `extraControls` for plot-specific toolbar controls.

## TODO

- The IP snapshot controls are compact toolbar buttons; if they crowd resized windows, move them into a small popover or the analysis panel.
- Band Diagram axis scale/offset controls are local UI state for now, not persisted in Project JSON.

## Simplifications / Technical Debt

- Band Diagram Y scale/offset applies directly to rendered point values. Scientific values in the metrics remain the unscaled analysis results.

## Verification

- Passed: `vp check`
- Passed: `vp test --coverage`
  - 8 files passed, 53 tests passed.
  - Coverage: statements 97.3%, branches 84.14%, functions 98.57%, lines 97.27%.
- Passed: `vp build`
- Passed: `pnpm binary:build`
- Browser check on `http://localhost:5173/`:
  - Demo data loaded.
  - IP snapshot controls and Band Diagram controls rendered.
  - Dragging a filled IP fit range shifted the range.
