# Iteration 044: Context menu and focus fix

## Purpose

- Fix context menu positioning and availability across plot and non-plot windows.
- Make the first click on a window both focus the window and let the clicked control work.
- Make window drag bring the window to the front before dragging.

## Implementation

- Rendered `ContextMenu` through `document.body` with a portal so workspace transforms do not offset menu coordinates.
- Moved window focus to `onPointerDownCapture` for left and right clicks.
- Kept drag and resize start focus behavior.
- Added plot context menu support to the no-data placeholder state.
- Stopped right-click pointer events on SVG plots after opening their plot menu, preventing parent window menu interference.

## Completed Scope

- Data Browser/Table context menu coordinates now use viewport coordinates instead of transformed workspace coordinates.
- Empty plot windows can open the plot context menu.
- Plot windows and window controls can be focused and operated on the same click.

## Simplifications / Technical Debt

- Context menu viewport-edge clamping remains future polish.
- z-index values are still monotonic and not normalized.

## Tests

- `vp check`
- `vp test --coverage`
- Browser smoke:
  - Empty UPS VB plot right-click opens `Reset view`, `Export PNG`, and `Export SVG` at the cursor area.
