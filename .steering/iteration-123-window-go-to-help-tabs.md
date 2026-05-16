# Iteration 123: Window Go To Position and Help Tabs

## Purpose

- Add a Windows menu action that moves the workspace viewport so a selected window appears at the visible center without changing the window geometry.
- Replace the compact Help text with semantic tabs and locale-aware Japanese/English content.

## Implemented

- Added `viewportCenteredOnWindow` and `goToWindow` to the workspace viewport module.
- Added `Go to position` to each Windows submenu; TopBar and background context menu share the same menu definition.
- Added a surface ref in `Workspace` so the action uses the actual visible workspace size.
- Reworked Help window into tabs: Overview, Data, UPS, LEIPS, Band, REELS, Plot, and Shortcuts.
- Added Japanese and English Help content using the existing localStorage-backed locale setting.
- Updated `docs/05-ui-workflows.md` with the new navigation and Help behavior.

## TODO

- Consider adding animated viewport movement if direct jumps feel abrupt.
- Help content may need screenshots or embedded diagrams after the UI stabilizes.

## Simplifications / Debt

- Help tab selection is intentionally local to the Help window and is not persisted.
- `Go to position` does not change z-order; use `Bring to front` separately when needed.

## Tests

- Passed: `vp check`
- Passed: `vp test --coverage`
- Passed: `vp build`
