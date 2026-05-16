# Iteration 112: Project store action slices

## Purpose

`projectStore.ts` に集中していたZustand actionを、dataset、analysis、UI、window、project/catalog lifecycleの意味単位へ分割する。

## Implemented

- `projectStoreDatasetActions.ts` にdataset load/add/delete/role/assignment actionを移した。
- `projectStoreAnalysisActions.ts` にfit range、UPS IP、bandpass、REELS、Band IP source、recalculate actionを移した。
- `projectStoreUiActions.ts` にplot viewport、cursor style、sample infoなどProject UI state actionを移した。
- `projectStoreWindowActions.ts` にwindow geometry/focus/help/project list actionを移した。
- `projectStoreLifecycleActions.ts` にProject/Catalog save/load/import/export/restore actionを移した。
- `projectStore.ts` はstore初期stateとslice合成、既存re-exportの入口に縮小した。

## TODO

- lifecycle helperをさらに `projectStoreLifecycleHelpers.ts` へ分離する。
- slice間で繰り返す `touchProject` / `recalculateProject` 更新パターンは後続でhelper化する。

## Simplifications / technical debt

- 公開API互換を優先し、sliceはZustand `set/get` を受け取るfactoryとして実装した。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
