# Iteration 119: Project store test docs and final gate

## Purpose

Store test分割後の責務境界をdocsへ反映し、最終ゲートでGo binary smokeまで確認する。

## Implemented

- `docs/06-architecture.md` にstore test helperと分割後test fileの責務を追記した。
- `projectStore.test.ts` 撤去後の行数を記録した。

## Line counts

- `src/store/projectStoreDatasets.test.ts`: 173 lines
- `src/store/projectStoreAnalysis.test.ts`: 377 lines
- `src/store/projectStoreLifecycle.test.ts`: 182 lines
- `src/store/projectStoreTestUtils.ts`: 78 lines

## TODO

- なし。

## Simplifications / technical debt

- `projectStoreAnalysis.test.ts` は377行で300行を超えている。analysis recalculation、normalization、Project UI state、window geometryのstore-adjacent契約をまとめて扱う意味単位を優先した。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- `./bin/ups-leips-analyzer --host 127.0.0.1 --port 4199`
- `curl -I http://127.0.0.1:4199/`
- `curl -I http://127.0.0.1:4199/assets/<built-js-asset>`
