# Iteration 114: Store/model docs and final gate

## Purpose

`projectStore.ts` / `projectModel.ts` の意味論ベース分割をSSoTへ反映し、最終ゲートとGoバイナリsmokeを通す。

## Implemented

- `docs/06-architecture.md` にProject model分割とProject store slice構成を追記した。
- 分割後の主要ファイル行数を確認した。

## Current line counts

- `src/store/projectModel.ts`: 48 lines
- `src/store/projectAnalysisRecalculation.ts`: 133 lines
- `src/store/projectNormalization.ts`: 111 lines
- `src/store/projectFitRanges.ts`: 136 lines
- `src/store/projectBandIpSource.ts`: 65 lines
- `src/store/projectAxisLabels.ts`: 11 lines
- `src/store/projectStore.ts`: 24 lines
- `src/store/projectStoreDatasetActions.ts`: 257 lines
- `src/store/projectStoreAnalysisActions.ts`: 181 lines
- `src/store/projectStoreUiActions.ts`: 101 lines
- `src/store/projectStoreWindowActions.ts`: 151 lines
- `src/store/projectStoreLifecycleActions.ts`: 210 lines
- `src/store/projectStoreLifecycleHelpers.ts`: 35 lines
- `src/store/projectStoreUpdateHelpers.ts`: 19 lines
- `src/store/projectStoreSliceTypes.ts`: 10 lines
- `src/App.test.tsx`: 399 lines
- `src/store/projectStore.test.ts`: 766 lines

## TODO

- `App.test.tsx` と `projectStore.test.ts` は統合テストとして残した。次に分割する場合は、workspace/menu、catalog/project、dataset、analysis、UI state単位で分ける。
- `projectStoreDatasetActions.ts` は300行未満だがやや密度が高い。さらに分けるならdataset CRUDとassignmentを分離する。

## Simplifications / technical debt

- Project JSON/Zustand API互換を優先し、barrel re-exportは残した。
- 機能追加やmigration追加は行っていない。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- `./bin/ups-leips-analyzer --host 127.0.0.1 --port 4198`
- `curl -I http://127.0.0.1:4198/`
- `curl -I http://127.0.0.1:4198/assets/...`
