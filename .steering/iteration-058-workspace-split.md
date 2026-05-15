# Iteration 058: Workspace Split

## Purpose

`Workspace.tsx`をviewport state、window rendering orchestration、modal orchestration中心に縮小し、menu/window helper/modalを責務別moduleへ分割する。

## Implemented

- `src/ui/workspace/WorkspaceMenu.tsx`を追加し、TopBarと共通menu definition builderを移した。
- `src/ui/workspace/WorkspaceWindows.tsx`を追加し、window kindごとのrender/icon/title/context menu/help windowを移した。
- `src/ui/workspace/WorkspaceModals.tsx`を追加し、Save as/Delete/Load Project modalを移した。
- `Workspace.tsx`はworkspace viewport、background pan/context menu、WindowFrame配置、modal open stateを持つ構成にした。
- Top menuと背景context menuは同じ`buildMenuGroups`を共有する挙動を維持した。

## Line Counts

- `src/ui/Workspace.tsx`: 278 lines
- `src/ui/workspace/WorkspaceMenu.tsx`: 158 lines
- `src/ui/workspace/WorkspaceWindows.tsx`: 183 lines
- `src/ui/workspace/WorkspaceModals.tsx`: 131 lines

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`

## TODO

- 最終Iterationで`pnpm binary:build`とGo binary smokeを実行する。

## Simplifications / Debt

- Component boundaries onlyを変更し、menu labelsやmodal behaviorは変更していない。
