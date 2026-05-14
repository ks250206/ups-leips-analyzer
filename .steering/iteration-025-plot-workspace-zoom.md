# Iteration 025: Plot and workspace zoom

## Purpose

- Add SciSpace-style plot zoom and workspace pan/zoom interactions.
- Keep plot zoom state when fitting cursors are moved.
- Adjust the initial window layout so the table sits below Data Browser and UPS VB/IP use the freed top area.

## Implemented

- Plot interactions:
  - Normal drag selects X/Y/XY zoom based on drag rectangle shape.
  - Shift-drag keeps the existing fitting range selection behavior.
  - Drag selection continues on the document, so releasing outside the plot still completes the selection.
  - Wheel pans Y by default.
  - Shift-wheel pans X.
  - Cmd/Ctrl-wheel zooms around the pointer.
  - Zoom state is captured and restored when React recreates the uPlot instance after fit cursor updates.
- Workspace interactions:
  - Background drag pans the work surface.
  - Wheel pans the workspace.
  - Shift-wheel pans horizontally.
  - Cmd/Ctrl-wheel zooms the workspace around the pointer.
  - `react-rnd` receives the active scale so window drag/resize remains usable while zoomed.
- Initial layout:
  - Table moved below Data Browser.
  - UPS VB and UPS IP moved into the top workspace area.
- Tests:
  - Added drag zoom mode and selection rectangle tests.

## TODO

- Consider exposing the current workspace zoom percentage in the top bar.
- Consider adding explicit plot toolbar toggles for zoom mode if Shift-drag fit selection becomes hard to discover.

## Simplifications / Technical Debt

- Plot wheel pan/zoom is local component state and not persisted in Project JSON.
- Workspace viewport is local UI state and not persisted.

## Verification

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
