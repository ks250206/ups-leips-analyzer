# Iteration 041: Wheel, pan, and Band auto-scale fix

## Purpose

- Fix Shift + wheel X zoom.
- Let Ctrl/Cmd + wheel keep the global workspace zoom behavior.
- Fix Alt-drag pan so the plot moves smoothly by the drag delta.
- Preserve Band Diagram visual scaling when UPS/LEIPS multiplier or offset controls change.

## Implemented

- Plot wheel routing:
  - `SpectrumPlot` now ignores Ctrl/Cmd wheel events so they bubble to the workspace.
  - Workspace zoom handles Ctrl/Cmd wheel even when the pointer is over a plot.
  - Plot wheel handling remains:
    - normal wheel: Y zoom
    - Shift + wheel: X zoom
    - Alt + wheel: Y pan
    - Alt + Shift + wheel: X pan
- Alt-drag pan:
  - Pan drag now captures the starting viewport once and applies movement relative to that fixed origin.
  - This removes cumulative over-pan caused by repeatedly applying deltas to an already shifted viewport.
- Band Diagram controls:
  - The Band Diagram tracks the current viewport.
  - When UPS/LEIPS multiplier or offset changes, the requested viewport is transformed with the same scale/offset so the visible appearance remains stable instead of auto-rescaling away the change.

## TODO

- Fine tune trackpad sensitivity separately from wheel-mouse sensitivity if real hardware behavior differs.

## Simplifications / Technical Debt

- Band Diagram visual-scale preservation is local UI state and is not persisted to Project JSON.

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
  - Shift + wheel changed the UPS VB plot X viewport.
  - Ctrl + wheel zoomed the workspace.
  - Alt-drag panned the UPS VB plot smoothly.
  - Wheel over the Band Diagram `UPS×` control changed its value.
