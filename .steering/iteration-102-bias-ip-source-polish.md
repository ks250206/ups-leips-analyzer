# Iteration 102: Bias dependence labels and IP source controls

## Purpose

- Restore UPS Bias Dependence fit equation labels.
- Show Band Diagram IP source controls from the UPS analysis panel as well as the Band panel.
- Fix subscript rendering and clipping for bias-dependence axis labels.

## Implemented

- Fit labels now render on plots that do not have cursor ranges, so UPS Bias Dependence shows `y = ax + b eV` annotations while keeping cursor-based plots unchanged.
- UPS analysis tab now includes the same IP source selector as Band Diagram plus read-only `0 V extrapolated IP` and `Average IP` values.
- Clicking/focusing the UPS Bias Dependence window opens the UPS analysis panel.
- Default Band IP source now prefers a 0 V IP dataset when one exists, otherwise uses `0 V extrapolated` for multiple IP datasets and dataset mode for a single IP dataset.
- Y-axis labels now reuse the same subscript renderer as x-axis labels, covering `Ecut-off` and `EVBM`.
- UPS Bias Dependence x-axis label gets extra bottom padding so `Vbias` subscript is not clipped.

## TODO

- Browser visual check with loaded user data remains useful because the in-app browser session opened to an empty project during this iteration.

## Simplified / Debt

- The IP source selector is shared as a local component in `AnalysisControls`; it can be extracted later if more panels need it.

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- Go binary smoke:
  - `curl -I http://127.0.0.1:4187/`
  - `curl -I http://127.0.0.1:4187/assets/data-vendor-CwOjQDDC.js`
