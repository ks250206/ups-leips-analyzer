# Iteration 113: Store helper cleanup

## Purpose

Iteration 112で分割したstore slicesから、DB lifecycle helperとProject更新helperをさらに分離する。

## Implemented

- `projectStoreLifecycleHelpers.ts` に `DEFAULT_CATALOG`、`activeProjectDb`、`latestProjectForCatalog` を移した。
- `projectStoreUpdateHelpers.ts` に `recalculateTouchedProject` と `touchProjectUi` を追加した。
- UI state actionは `touchProjectUi` を使う形に整理した。

## TODO

- analysis/dataset/window actionにも共通更新helperを広げられるが、過度な抽象化を避けるため今回はUI state中心に留めた。

## Simplifications / technical debt

- 挙動変更を避けるため、store actionの制御フローは変更していない。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
