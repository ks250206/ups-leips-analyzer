# Iteration 124: Help Window Layout Polish

## Purpose

- Adjust the Help utility window default geometry to match the current workspace layout.
- Make Help tabs visually align with the UPS_analysis tab style.

## Implemented

- Help window now opens near the right-side analysis column, lower in the workspace, with a larger reading area.
- Help width follows the UPS_analysis window width with a practical minimum, and height defaults to 560 px.
- Help tab buttons now use the same slate active state, border, and compact sizing as Analysis Controls.
- Added store coverage for the Help utility window default geometry.

## TODO

- Revisit if the overall default workspace grid changes again.

## Simplifications / Debt

- Help placement is anchored to the analysis column top plus a fixed vertical offset rather than collision-detecting nearby windows.

## Tests

- Passed: `vp check --fix`
- Passed: `vp test --coverage`
- Passed: `vp build`
