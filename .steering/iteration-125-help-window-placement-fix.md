# Iteration 125: Help Window Placement Fix

## Purpose

- Correct the Help utility window placement so it opens below the UPS_analysis window instead of overlapping its body.
- Make the Help tabs match the Analysis Controls tab surface more closely.

## Implemented

- Help window `y` is calculated from the UPS_analysis window bottom plus spacing.
- Help uses an off-white container, a tab strip area, and a white scrollable body.
- Help tab buttons use the same compact slate active state and white inactive state as UPS_analysis.

## TODO

- None for this iteration.

## Simplifications / Debt

- Existing already-open Help windows keep their current stored geometry until toggled or reset.

## Tests

- Passed: `vp check --fix`
- Passed: `vp test --coverage`
- Passed: `vp build`
