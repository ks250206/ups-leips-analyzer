# Iteration 033: D3 plot foundation

## Purpose

- Replace the uPlot-backed `SpectrumPlot` internals with a D3/SVG foundation while keeping the existing React props.
- Make axes, ticks, labels, plot border, series paths, and No data rendering share one SVG coordinate system.

## Implemented

- Added modular D3 dependencies:
  - `d3-array`
  - `d3-axis`
  - `d3-drag`
  - `d3-scale`
  - `d3-selection`
  - `d3-shape`
  - `d3-zoom`
- Replaced uPlot instance creation with React-rendered SVG using D3 scales and paths.
- Preserved the public `SpectrumPlot` props used by UPS, LEIPS, LEIPS Evac, and Band Diagram windows.
- Implemented:
  - Normal and reversed X scale ranges.
  - Left and right Y scales.
  - Axis ticks, labels, grid lines, and solid plot border in SVG.
  - No data placeholder without constructing a plot instance.
  - Fit series exclusion from automatic X/Y scaling via `affectsScale: false`.
- Ported the existing interaction shell onto SVG so later iterations can refine behavior without reintroducing uPlot:
  - Cursor handles.
  - Shift-drag fit range selection.
  - Drag zoom.
  - Wheel pan / Cmd-wheel zoom.
  - Double-click reset.
- Removed the uPlot CSS import and uPlot-specific global CSS.

## TODO

- Remove the `uplot` package after all migration gates pass.
- Refine marker/cursor visual parity in the next iteration.
- Verify the SVG output in the in-app browser after interaction support is in place.

## Simplifications / Technical Debt

- Axis rendering is manual SVG tick rendering using D3 scales. The D3 axis package is installed for the migration target but not yet required by the current renderer.
- Existing export buttons now serialize the live SVG; styling is kept as SVG attributes to avoid CSS export drift.

## Verification

- Passed: `vp check --fix`
- Passed: `vp test --coverage`
  - 8 files passed, 47 tests passed.
  - Coverage: statements 97.3%, branches 84.14%, functions 98.57%, lines 97.27%.
- Passed: `vp build`
