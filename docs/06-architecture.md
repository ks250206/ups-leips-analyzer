# Architecture

## Layers

- `src/domain`: スペクトル型、線形fit、ガウスfit、UPS/LEIPS/REELS/バンド図計算。
- `src/io`: MultiPak CSV parserとdataset kind推定。
- `src/store`: Zustand store、Dexie database、Project JSON import/export。
- `src/ui`: Workspace window、Data Browser、Table、D3/SVG plot wrapper、解析パネル。

## Module Responsibilities

- `src/store/projectStore.ts`: Zustand state/action wiring、Dexie呼び出し、公開store API。
- `src/store/projectFactory.ts`: 空Project、demo Project、初期dataset/window生成。
- `src/store/projectModel.ts`: 解析再計算、dataset auto selection、fit range migration、Project JSON変換。
- `src/store/windowModel.ts`: workspace window生成とdefault layout。
- `ProjectSnapshot.ui`: Band Diagram viewportなどProjectと一緒に復元したいUI state。
- `src/ui/Workspace.tsx`: workspace viewport、background pan/context menu、window frame配置、modal open state。
- `src/ui/workspace/WorkspaceMenu.tsx`: TopBar/background context menuの共通menu definition。
- `src/ui/workspace/WorkspaceWindows.tsx`: window kindごとのtitle/icon/render/context menu/help window。
- `src/ui/workspace/WorkspaceModals.tsx`: Save as、Delete、Load Project modal。
- `src/ui/windows/SpectrumPlot.tsx`: D3/SVG plot container、viewport state、public props compatibility。
- `src/ui/windows/SpectrumPlotScales.ts`: plot geometry、domain、scale、tick formatting。
- `src/ui/windows/SpectrumPlotViewport.ts`: wheel/drag viewport math、range math、series visibility判定。
- `src/ui/windows/SpectrumPlotInteraction.ts`: pointer lifecycle for plot drag/pan/cursor/range drag。
- `src/ui/windows/SpectrumPlotParts.tsx`: axis、series path、range band、marker、cursor handle SVG部品。
- `src/ui/windows/BandDiagramWindow.tsx`: Band Diagram control stateとplot/control composition。
- `src/ui/windows/bandDiagramModel.ts`: Igor風Band Diagram model、auto viewport、data signature、percent offset。
- `src/ui/windows/bandDiagramInteraction.ts`: Band Diagram wheel/drag/pan viewport math。
- `src/ui/windows/BandDiagramPlot.tsx`: Band Diagram専用SVG plot。
- `src/ui/windows/BandDiagramAnnotations.tsx`: VBM/CBM/Vacuum線、IP/EA/Eg矢印annotation。
- `src/ui/windows/BandDiagramControls.tsx`: Band Diagram compact control inputs。

## State

Zustandは現在のProject snapshotを保持する。Dexieは保存済みProjectを保持する。Project JSONは同じsnapshot構造を使う。

## Build

`vp build` が静的assetsを `dist/` に生成し、Goの `main.go` が `dist/` を埋め込んで配信する。
