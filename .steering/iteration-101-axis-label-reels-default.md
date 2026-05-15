# Iteration 101: Axis label scoped spacing and REELS BG default

## Purpose

- Undo the unintended global x-axis label offset change while keeping the extra clearance needed by `LEIPS Plot` and `LEIPS vs Energy from Evac.`.
- Make REELS BG fitting default to single point mode.

## Implemented

- Added `xLabelBottomPadding` to `SpectrumPlot` so x-axis label position can be tuned per plot instead of globally.
- Restored normal plot geometry spacing and applied larger bottom label padding only to LEIPS raw/Evac plots.
- Kept LEIPS plot windows at the taller layout introduced in the previous iteration.
- Set REELS BG mode default to `single-point` in UI, project normalization, recalculation, and demo analysis.
- Updated component/store tests for the scoped axis geometry and REELS default.

## TODO

- Browser visual pass is still useful after more plot layout changes accumulate.

## Simplified / Debt

- REELS domain function still supports fit-range as the implicit low-level default; project/UI callers now pass the v1 app default explicitly.

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- Go binary smoke:
  - `curl -I http://127.0.0.1:4187/`
  - `curl -I http://127.0.0.1:4187/assets/data-vendor-CwOjQDDC.js`
