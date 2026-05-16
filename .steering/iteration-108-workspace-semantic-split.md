# Iteration 108: Workspace semantic split

## Purpose

`Workspace.tsx` をworkspace orchestration中心に縮小する。
TopBar、context menu、window focus、last-opened restore、modal flow、viewport pan/zoomの挙動は変更しない。

## Implemented

- `Workspace.tsx` から以下を意味単位で分離した。
  - `WorkspaceModalLayer.tsx`: project/catalog modal rendering
  - `WorkspaceModalActions.ts`: modal action side effects
  - `WorkspaceFileActions.ts`: project/catalog import/export
  - `WorkspaceViewport.ts`: workspace pan/zoom state and handlers
  - `WorkspaceLastOpened.ts`: last-opened restore/write effects
  - `UpsIpTitleSelector.tsx`: UPS IP titlebar dataset selector
  - `workspaceTabs.ts`: window kind to analysis tab mapping

## Current line counts

- `src/ui/Workspace.tsx`: 350 lines
- `src/ui/workspace/WorkspaceModalLayer.tsx`: 132 lines
- `src/ui/workspace/WorkspaceModalActions.ts`: 165 lines
- `src/ui/workspace/WorkspaceFileActions.ts`: 87 lines
- `src/ui/workspace/WorkspaceViewport.ts`: 77 lines
- `src/ui/workspace/WorkspaceLastOpened.ts`: 63 lines
- `src/ui/workspace/UpsIpTitleSelector.tsx`: 32 lines
- `src/ui/workspace/workspaceTabs.ts`: 24 lines

## TODO

- 後続iterationでStore/modelと巨大testを分割する。

## Simplifications / technical debt

- `Workspace.tsx` は努力目標上限の350行ちょうど。window layer JSXがまだ残るが、これ以上切るとprops受け渡しが増えるため今回は維持した。

## Tests

- `vp check`
