# Iteration 110: Refactor cleanup and docs

## Purpose

意味論ベース分割後のmodule責務をSSoTへ反映し、残る巨大ファイルと次の分割単位を明確にする。

## Implemented

- `docs/06-architecture.md` に分割後のplot、UPS window、Analysis Controls、Workspace、Store/model責務を追記した。
- 現時点の主要ファイル行数を確認した。

## Current line counts

- `src/ui/windows/SpectrumPlot.tsx`: 223 lines
- `src/ui/windows/SpectrumPlotParts.tsx`: 8 lines
- `src/ui/windows/UPSPlotWindow.tsx`: 3 lines
- `src/ui/windows/AnalysisControls.tsx`: 266 lines
- `src/ui/Workspace.tsx`: 350 lines
- `src/store/projectModel.ts`: 482 lines
- `src/store/projectStore.ts`: 832 lines
- `src/App.test.tsx`: 399 lines
- `src/store/projectStore.test.ts`: 766 lines

## TODO

- `projectStore.ts` をcatalog/project lifecycle、dataset、analysis、UI viewport/window action sliceへ追加分割する。
- `projectModel.ts` をrecalculation、normalization、fit range defaults、band IP sourceへ追加分割する。
- `App.test.tsx` と `projectStore.test.ts` は挙動固定用の統合テストとして残した。次に分ける場合は、テスト名単位でworkspace/menu、catalog/project、dataset、analysis、UI stateへ分ける。

## Simplifications / technical debt

- Test file splitは今回未実施。実装ファイル分割後の挙動確認を優先した。
- Store/modelの300行目標は未達。公開API互換を優先し、低リスクなhelper/type分離までに留めた。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- `./bin/ups-leips-analyzer --host 127.0.0.1 --port 4197`
- `curl -I http://127.0.0.1:4197/`
- `curl -I http://127.0.0.1:4197/assets/...`
