# Iteration 105: Plot semantic split

## Purpose

`SpectrumPlot.tsx` と `SpectrumPlotParts.tsx` を、描画責務ごとの意味単位に分割する。
挙動変更は行わず、D3 SVG plot API と既存テストの期待値を維持する。

## Implemented

- `SpectrumPlot.tsx` をplot container、viewport同期、event配線中心に縮小した。
- `SpectrumPlotParts.tsx` を互換re-exportにし、以下へ分割した。
  - `SpectrumPlotAxes.tsx`: 軸、tick、軸ラベル
  - `SpectrumPlotSeries.tsx`: series path、fit label位置計算
  - `SpectrumPlotCursors.tsx`: range band、range cursor、point cursor
  - `SpectrumPlotSinglePointCursors.tsx`: REELS single point cursor
  - `SpectrumPlotCursorModel.ts`: cursor対象seriesと補間helper
  - `SpectrumPlotMarkers.tsx`: marker線、annotation
  - `SpectrumPlotContextMenu.ts`: plot context menu
  - `SpectrumPlotViewportState.ts`: viewport request同期とecho guard
  - `SpectrumPlotSvg.tsx`: SVG composition

## Current line counts

- `src/ui/windows/SpectrumPlot.tsx`: 223 lines
- `src/ui/windows/SpectrumPlotParts.tsx`: 10 lines
- `src/ui/windows/SpectrumPlotSvg.tsx`: 237 lines
- `src/ui/windows/SpectrumPlotAxes.tsx`: 186 lines
- `src/ui/windows/SpectrumPlotSeries.tsx`: 143 lines
- `src/ui/windows/SpectrumPlotCursors.tsx`: 186 lines
- `src/ui/windows/SpectrumPlotSinglePointCursors.tsx`: 165 lines
- `src/ui/windows/SpectrumPlotCursorModel.ts`: 61 lines

## TODO

- 後続iterationでUPS window、Analysis Controls、Workspace、Store/modelを同じ方針で分割する。

## Simplifications / technical debt

- `SpectrumPlotParts.tsx` は既存import互換のためre-exportとして残した。

## Tests

- `vp check --fix`
- `vp test src/ui/windows/SpectrumPlot.test.ts --coverage=false`
