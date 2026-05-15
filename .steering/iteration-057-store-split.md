# Iteration 057: Store Split

## Purpose

`projectStore.ts`をZustand action wiring中心に縮小し、Project生成、解析再計算、dataset/fit range helper、utility window helperを責務別moduleへ分割する。

## Implemented

- `src/store/projectModel.ts`を追加し、解析再計算、fit target mapping、dataset auto select、fit range auto initialization、Project normalize、bandpass解決を移した。
- `src/store/projectFactory.ts`を追加し、empty/demo Project生成とdefault window layoutを移した。
- `src/store/windowModel.ts`を追加し、Help/Project List utility window toggleを移した。
- `projectStore.ts`はstore state/action wiringとDexie操作の呼び出し中心にした。
- 既存export互換のため、`createInitialProject`、`fitRangeKey`、`resolvedBandpassEnergy`は`projectStore.ts`からre-exportした。

## Line Counts

- `src/store/projectStore.ts`: 274 lines
- `src/store/projectModel.ts`: 287 lines
- `src/store/projectFactory.ts`: 120 lines
- `src/store/windowModel.ts`: 29 lines

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`

## TODO

- 最終Iterationで`pnpm binary:build`とGo binary smokeを実行する。

## Simplifications / Debt

- Store API名は互換維持した。保存済みProject migrationは追加していない。
