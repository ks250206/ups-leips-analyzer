# Iteration 045: LEIPS menu and drag fix

## Purpose

- Put LEIPS Evac BG cursors on the high-energy side by default.
- Replace the temporary LEIPS Plot filter action with bandpass filter selection.
- Disable export actions when a plot has no data.
- Add a workspace background context menu.
- Fix first-drag behavior for unfocused windows.

## Implementation

- Swapped default LEIPS Evac edge/background ranges:
  - Edge now initializes on the lower-energy onset side.
  - BG now initializes on the higher-energy side.
- Updated imported-data auto-fit fractions to match the same edge/BG placement.
- Changed LEIPS Plot `Filter` submenu to bandpass choices from `BANDPASS_OPTIONS`.
- Added disabled context menu items for PNG/SVG export when no data is available.
- Added workspace background context menu with Load Demo, Recalculate, and New Project.
- Kept window render order stable and relied on z-index for stacking, so focusing a window no longer reorders DOM nodes during pointer down.

## Completed Scope

- LEIPS vs Energy from Evac shows BG on the high-energy side after Demo load.
- LEIPS Plot context menu exposes bandpass filter choices.
- No-data plot export commands are visible but disabled.
- Background right-click opens the app context menu instead of the browser menu.
- First click/drag on a background window can focus and start interaction without a separate pre-click.

## Simplifications / Technical Debt

- Context menu viewport-edge clamping is still deferred.
- Background context menu contains only project/workspace-level commands.

## Tests

- `vp check`
- `vp test --coverage`
- Browser smoke:
  - Background right-click opens app menu.
  - No-data plot export commands are disabled.
  - Demo LEIPS Evac BG appears on the high-energy side.
