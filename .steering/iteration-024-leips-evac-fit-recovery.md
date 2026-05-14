# Iteration 024: LEIPS Evac fit recovery

## Purpose

- Fix the repeated `LEIPS: Linear fit requires at least two points in the selected range.` state after loading LEIPS data.
- Keep the LEIPS vs Energy from Evac. plot usable even when the full LEIPS analysis has not yet succeeded.

## Implemented

- Added LEIPS Evac auto-range fallback for `leipsEdge` and `leipsBackground`.
  - Existing user ranges are preserved when they already include at least two transformed LEIPS points.
  - Invalid ranges are moved into quantile-based regions of the Evac-transformed spectrum.
- Recomputed these range fallbacks when datasets are loaded, assigned to analysis slots, or the bandpass filter changes.
- Added a LEIPS Evac plot fallback that estimates `Evac` from the LEET(der) peak maximum plus the selected bandpass energy.
  - This lets the transformed LEIPS curve and range cursors remain visible even if edge/BG linear fitting is currently failing.
- Added a store regression test for loaded LEIPS data whose Evac-transformed X range does not include the default edge/BG ranges.

## TODO

- Replace the duplicated LEIPS Evac estimation helper in UI/store with a shared domain helper once the partial-result model is formalized.
- Consider storing a partial LEIPS result so UI panels can display estimated `Evac` and transformed curves consistently before final EA fitting succeeds.

## Simplifications / Technical Debt

- The fallback Evac estimate uses the maximum LEET(der) point inside the peak cursor, not the Gaussian center.
- Fallback edge/BG ranges are generic quantile ranges, not onset-aware automatic fitting.

## Verification

- `vp check --fix`
- `vp test --coverage`
