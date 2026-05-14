# Iteration 027: Plot title and workspace layout

## Purpose

- Remove inner plot titles because each window already has a title bar.
- Make the default empty-project layout closer to the provided reference screenshot.

## Implemented

- Removed `uPlot` inner `title` from `SpectrumPlot` options.
- Added a regression test that `createSpectrumPlotOptions` does not set an inner title.
- Adjusted default window layout:
  - Data Browser remains left.
  - Table remains below Data Browser.
  - UPS VB and UPS IP are widened across the top row.
  - LEIPS Plot and LEIPS vs Energy from Evac. align below them.
  - Band Diagram is widened and made taller in the lower-right area.
  - Analysis controls remain on the right.

## TODO

- If persisted projects keep older window geometry, consider adding a layout reset command.

## Simplifications / Technical Debt

- This changes only default window geometry for new/demo/import-normalized projects; existing saved IndexedDB layouts are not migrated.

## Verification

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
