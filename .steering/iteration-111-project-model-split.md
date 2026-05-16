# Iteration 111: Project model semantic split

## Purpose

`projectModel.ts` に残っていた再計算、normalization、fit range推定、Band IP解決、axis labelを意味単位へ分割する。

## Implemented

- `projectAnalysisRecalculation.ts` に解析再計算フローを移した。
- `projectNormalization.ts` にProject import/load normalizationを移した。
- `projectFitRanges.ts` にfit range自動推定とbandpass解決を移した。
- `projectBandIpSource.ts` にBand DiagramのIP source解決を移した。
- `projectAxisLabels.ts` にdataset kind別axis labelを移した。
- `projectModel.ts` は既存import互換のre-exportと `fitRangeKey` / `touchProject` の入口に縮小した。

## TODO

- `projectStore.ts` をstore action sliceへ分割する。
- `projectModel.ts` のbarrel re-exportは互換維持用。循環が出ない範囲で後続整理する。

## Simplifications / technical debt

- 挙動変更を避けるため、helperの実装ロジックは移動のみとした。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
