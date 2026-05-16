# Iteration 106: UPS plot window semantic split

## Purpose

`UPSPlotWindow.tsx` をVB、IP、bias dependence、共有modelへ意味単位で分割する。
UPS plotの表示、per-IP viewport、context menu、bias dependenceの挙動は変更しない。

## Implemented

- `UPSPlotWindow.tsx` を互換re-exportにした。
- `UPSVBPlotWindow.tsx` にUPS VB plotを移動した。
- `UPSIPPlotWindow.tsx` にUPS IP plot、dataset context menu、snapshot view操作を移動した。
- `UPSBiasDependenceWindow.tsx` にCutoff/EVBM/IPのbias dependence表示を移動した。
- `UPSPlotModel.ts` にbias plot定義、default IP ranges、viewport helper、fit target helperを移動した。

## Current line counts

- `src/ui/windows/UPSPlotWindow.tsx`: 3 lines
- `src/ui/windows/UPSVBPlotWindow.tsx`: 105 lines
- `src/ui/windows/UPSIPPlotWindow.tsx`: 275 lines
- `src/ui/windows/UPSBiasDependenceWindow.tsx`: 96 lines
- `src/ui/windows/UPSPlotModel.ts`: 52 lines

## TODO

- 後続iterationでAnalysis Controls、Workspace、Store/model、巨大testを分割する。

## Simplifications / technical debt

- 既存import互換のため `UPSPlotWindow.tsx` をbarrelとして残した。

## Tests

- `vp check`
