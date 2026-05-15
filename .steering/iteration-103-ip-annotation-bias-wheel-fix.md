# Iteration 103: IP annotation, bias label layout, and wheel viewport stability

## Purpose

- Show each UPS IP dataset's calculated IP directly on the UPS IP plot.
- Keep UPS Bias Dependence fit equations and x-axis label inside the plot window.
- Prevent plot wheel zoom/pan from entering a React maximum update depth loop.

## Implemented

- Added a top-right `IP=... eV` annotation to the UPS IP plot.
- Added a dedicated `bias` plot margin variant so UPS Bias Dependence gets extra x-label clearance without changing other plots.
- Converted Bias Dependence fit equation labels to strings so their width is estimated correctly and clamped inside the plot.
- Added viewport equality checks in `SpectrumPlot` so identical viewport requests do not trigger recursive state updates after wheel interactions.
- Added tests for the IP annotation and bias-only geometry margin.

## TODO

- If more plot-specific label layouts appear, replace `marginVariant` with an explicit margin object.

## Simplified / Debt

- The viewport equality check compares exact numeric values. If later interactions introduce tiny float jitter, consider epsilon comparison.

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- Go binary smoke:
  - `curl -I http://127.0.0.1:4187/`
  - `curl -I http://127.0.0.1:4187/assets/data-vendor-CwOjQDDC.js`
