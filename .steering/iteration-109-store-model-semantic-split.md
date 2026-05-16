# Iteration 109: Store/model semantic split

## Purpose

Store/modelの公開APIとProject JSON互換を維持しつつ、低レベルhelperと型定義を意味単位で分離する。

## Implemented

- `projectStoreTypes.ts` にZustand store interfaceを移動した。
- `projectStoreHelpers.ts` にdataset selection repair、UPS IP fit range/config seed、record key omit helperを移動した。
- `projectModelSelection.ts` にdataset merge、demo判定、auto selection、UPS IP selection/range/applied voltage helperを移動した。
- `projectModel.ts` は既存import互換のため、移動したselection helperをre-exportする。

## Current line counts

- `src/store/projectStore.ts`: 836 lines
- `src/store/projectStoreTypes.ts`: 79 lines
- `src/store/projectStoreHelpers.ts`: 76 lines
- `src/store/projectModel.ts`: 482 lines
- `src/store/projectModelSelection.ts`: 90 lines

## TODO

- `projectStore.ts` はまだ大きい。次の安全な分割単位は以下。
  - catalog/project lifecycle actions
  - dataset actions
  - analysis actions
  - UI viewport/window actions
- `projectModel.ts` は次にrecalculation、normalization、fit range defaults、band IP sourceへ切る。

## Simplifications / technical debt

- 今回は公開store APIを壊さないことを優先し、Zustand slice factory化までは行わなかった。
- 300行目標は未達。Store/modelはテスト範囲が広いため、次iterationで追加分割する。

## Tests

- `vp check`
