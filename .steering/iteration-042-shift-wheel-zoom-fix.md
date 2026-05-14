# Iteration 042: Shift wheel zoom fix

## Purpose

- Fix plot Shift + mouse-wheel zoom when the browser reports the gesture as horizontal wheel movement.
- Keep the existing mouse operation contract:
  - normal wheel: Y zoom
  - Shift wheel: X zoom
  - Alt wheel: Y pan
  - Alt + Shift wheel: X pan
  - Ctrl/Cmd wheel: workspace zoom

## Implementation

- Updated `nextViewportAfterWheel` so horizontal-wheel dominant events are treated like Shift-wheel X operations.
- X zoom now uses `deltaY || deltaX`, so both native Shift-wheel and browser-translated horizontal wheel events produce a non-1 zoom factor.
- Alt + horizontal-wheel dominant events now map to X pan, matching Alt + Shift-wheel behavior.
- Added unit coverage for horizontal-wheel based X zoom.

## Completed Scope

- Shift-wheel fallback logic is implemented in the D3 plot interaction helper.
- Browser verification confirmed that horizontal wheel over the UPS VB plot changes the X range.

## Simplifications / Technical Debt

- The horizontal-wheel threshold is a pragmatic `abs(deltaX) > abs(deltaY) * 1.2` guard to avoid treating slight diagonal trackpad movement as X zoom.
- Fine-grained per-device sensitivity tuning remains a future polish item.

## Tests

- `vp check`
- `vp test --coverage`
- Browser smoke:
  - Load Demo data.
  - Horizontal wheel over UPS VB plot zoomed the X axis.
