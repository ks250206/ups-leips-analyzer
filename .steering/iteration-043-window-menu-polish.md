# Iteration 043: Window menu polish

## Purpose

- Move window focus to click-driven behavior.
- Move plot commands into context menus.
- Add a Project menu to the top bar.
- Lighten the workspace background.

## Implementation

- Removed hover-based z-index changes from `WindowFrame`; focus now happens on click, drag start, resize start, and right-click.
- Added shared `ContextMenu` and `useContextMenu`.
- Moved plot `Reset view`, `Export PNG`, and `Export SVG` into the plot context menu.
- Moved UPS IP view snapshot actions into its context menu.
- Added a LEIPS Plot `Filter` submenu with `Set peak range from current max`.
- Added a top-bar `Project` menu with New Project, Save Project, Save as, Recent project, Export, and Import.
- Added store APIs for new project, save as, loading saved projects, and listing recent projects.
- Replaced prompt-based Save as with an inline menu input because the in-app browser does not support `prompt()`.
- Changed workspace background to a lighter off-white and reduced grid contrast.

## Completed Scope

- Project menu and plot context menu are available in the running UI.
- Plot command buttons are no longer shown in the plot upper-right corner.
- Existing Data Browser JSON/Import controls remain for compatibility.

## Simplifications / Technical Debt

- Recent project uses IndexedDB records only; file-system recent history is not tracked.
- Context menu placement does not yet clamp to viewport edges.
- LEIPS Filter submenu only includes an immediately executable fit-range helper; actual smoothing/filter processing remains future work.
- z-index values still monotonically increase and are not normalized.

## Tests

- `vp check`
- `vp test --coverage`
- Browser smoke:
  - Project menu opens and Save as shows an inline input.
  - Demo data loads with no plot command buttons visible.
