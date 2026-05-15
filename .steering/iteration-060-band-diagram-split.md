# Iteration 060: Band Diagram Split

## Purpose

`BandDiagramWindow.tsx`をcontrol stateとplot呼び出しに寄せ、Igor風band diagramのmodel、interaction、annotation、controlsを分離する。

## Implemented

- `bandDiagramModel.ts`に`IgorBandModel`、auto viewport、data signature、percent offset変換を移した。
- `bandDiagramInteraction.ts`にwheel/drag/pan viewport計算とpointer lifecycleを移した。
- `BandDiagramPlot.tsx`に専用SVG plot本体を移した。
- `BandDiagramAnnotations.tsx`にVBM/CBM/Vacuum線とIP/EA/Eg矢印を移した。
- `BandDiagramControls.tsx`にcompact number inputを移した。
- `BandDiagramWindow.test.ts`はmodel/interaction moduleを直接importする形に変更した。

## Line Counts

- `src/ui/windows/BandDiagramWindow.tsx`: 231 lines
- `src/ui/windows/BandDiagramPlot.tsx`: 357 lines
- `src/ui/windows/BandDiagramAnnotations.tsx`: 83 lines
- `src/ui/windows/BandDiagramControls.tsx`: 31 lines
- `src/ui/windows/bandDiagramModel.ts`: 171 lines
- `src/ui/windows/bandDiagramInteraction.ts`: 263 lines

## Tests

- `vp check --fix`
- `vp test --coverage`
- `vp build`

## TODO

- `BandDiagramPlot.tsx`はSVG構成を一箇所で読みたい都合で357行に残した。300行以下にするならaxis/labels/series layerを追加分割する。
- 最終Iterationで`pnpm binary:build`とGo binary smokeを実行する。

## Simplifications / Debt

- 挙動変更なしを優先し、plot寸法・annotation配置・context menu構成は既存実装を維持した。
