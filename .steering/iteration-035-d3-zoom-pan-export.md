# Iteration 035: D3 zoom, pan, and export

## Purpose

- Complete the plot migration by removing uPlot and locking D3/SVG zoom, pan, reset, and export behavior.

## Implemented

- D3/SVG plot interactions:
  - Normal drag chooses X/Y/XY zoom from the drag rectangle shape.
  - Shift-drag selects a fitting range.
  - Wheel pans Y; Shift-wheel pans X.
  - Cmd/Ctrl-wheel zooms around the pointer anchor.
  - Double-click resets the viewport.
- Export:
  - SVG export serializes the live SVG.
  - PNG export renders the live SVG into a canvas.
- Added `zoomRangeAt` unit coverage for pointer-centered zoom math.
- Removed the `uplot` package dependency.
- Updated SSoT references from uPlot to D3/SVG:
  - `AGENTS.md`
  - `docs/06-architecture.md`

## TODO

- Browser-verify the D3 interaction feel against the SciSpace reference after the dev server reloads.
- Add richer Band Diagram annotation arrows and larger `IP`/`EA`/`Eg` typography in a later visual iteration.

## Simplifications / Technical Debt

- D3 interaction behavior is implemented in React pointer/wheel handlers using D3 scales rather than imperative `d3-zoom`/`d3-drag` bindings. This keeps React state ownership simple while still using D3 for coordinate math and SVG rendering.

## Verification

- Passed: `vp check`
- Passed: `vp test --coverage`
  - 8 files passed, 49 tests passed.
  - Coverage: statements 97.3%, branches 84.14%, functions 98.57%, lines 97.27%.
- Passed: `vp build`
- Passed: `pnpm binary:build`
- Binary HTTP check:
  - `curl -I http://127.0.0.1:4187/` returned `200 OK`, but the port was already occupied by an existing process.
  - Started the newly built binary on `127.0.0.1:4199`.
  - `curl -I http://127.0.0.1:4199/` returned `200 OK`.
  - `curl -I http://127.0.0.1:4199/assets/index-BR-QhhGt.js` returned `200 OK`.
- Browser check on `http://localhost:5173/`:
  - Demo data loaded.
  - UPS VB, UPS IP, LEIPS, LEIPS Evac, and Band Diagram plot SVGs rendered.
  - Browser console error log was empty.
