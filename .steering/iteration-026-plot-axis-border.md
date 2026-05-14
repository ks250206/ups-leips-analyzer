# Iteration 026: Plot axis and border recovery

## Purpose

- Restore visible left-axis space on normal plot windows.
- Keep tick hiding scoped to Band Diagram only.
- Add top/bottom/left/right plot-area borders to every `SpectrumPlot`.

## Implemented

- Set explicit uPlot axis sizes:
  - X axis: `48`
  - Left Y axis: `64`
  - Right Y axis: `58`
- Kept `hideYTicks` as an opt-in prop used by Band Diagram.
- Added a canvas border around the actual uPlot plot area in the draw hook.
- Added a regression test that normal plots keep left-axis values enabled and reserve axis space.

## TODO

- If narrow windows still clip long Y labels, consider responsive label shortening per plot.

## Simplifications / Technical Debt

- The plot border is canvas-drawn, so SVG export border styling remains the existing export implementation.

## Verification

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
