# Iteration 104: Viewport echo guard and license docs

## Purpose

- Fix the remaining wheel-zoom crash caused by viewport synchronization feedback.
- Add README license information and an MIT license file.

## Implemented

- Suppressed `onViewportChange` emission when `SpectrumPlot` is only applying an external `viewportRequest`.
- Added viewport validation so NaN, Infinity, or zero-width domains from wheel events are ignored before they reach D3 scales or persisted UI state.
- Added a component regression test that externally requested viewport changes are not echoed back to the parent.
- Added `LICENSE` with MIT terms for `ks25026` in 2026.
- Added `license: MIT` to `package.json`.
- Added a README License section.

## TODO

- If wheel input still produces pathological values on specific devices, add device-level delta normalization around `nextViewportAfterWheel`.

## Simplified / Debt

- Viewport equality remains exact; epsilon equality can be introduced if high-frequency floating point jitter appears.

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- Go binary smoke:
  - `curl -I http://127.0.0.1:4187/`
  - `curl -I http://127.0.0.1:4187/assets/data-vendor-CwOjQDDC.js`
