# Iteration 061: Cleanup and Docs

## Purpose

Store、Workspace、SpectrumPlot、BandDiagram分割後の責務をdocsへ反映し、最終ゲートとGo binary smokeを通す。

## Implemented

- `docs/06-architecture.md`へ分割後のmodule responsibilityを追記した。
- 分割後の主要ファイル行数を確認した。
- 最終gateとしてVite+ check/test/build、Go binary build、HTTP smokeを実行した。

## Line Counts

- `src/store/projectStore.ts`: 274 lines
- `src/store/projectModel.ts`: 287 lines
- `src/store/projectFactory.ts`: 120 lines
- `src/ui/Workspace.tsx`: 278 lines
- `src/ui/workspace/WorkspaceMenu.tsx`: 158 lines
- `src/ui/workspace/WorkspaceWindows.tsx`: 183 lines
- `src/ui/workspace/WorkspaceModals.tsx`: 131 lines
- `src/ui/windows/SpectrumPlot.tsx`: 319 lines
- `src/ui/windows/SpectrumPlotParts.tsx`: 323 lines
- `src/ui/windows/SpectrumPlotViewport.ts`: 280 lines
- `src/ui/windows/BandDiagramWindow.tsx`: 231 lines
- `src/ui/windows/BandDiagramPlot.tsx`: 357 lines
- `src/ui/windows/bandDiagramModel.ts`: 171 lines
- `src/ui/windows/bandDiagramInteraction.ts`: 263 lines

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- `./bin/ups-leips-analyzer -port 4199` smoke:
  - `curl -I http://127.0.0.1:4199/` returned `200 OK`
  - `curl -I http://127.0.0.1:4199/assets/index-BH5EoGXZ.css` returned `200 OK`

## TODO

- `SpectrumPlot.tsx`、`SpectrumPlotParts.tsx`、`BandDiagramPlot.tsx`は300行を超えている。root責務は分離済みだが、追加でaxis/series/annotation layerを細分化すれば300行以下にできる。
- bundle warningは既存どおり残る。後続でmanual chunkingまたはdynamic importを検討する。

## Simplifications / Debt

- 挙動変更なしを優先し、Project JSON migrationやUI仕様変更は入れていない。
- `SpectrumPlotModel.ts`は既存helper import互換のfaçadeとして維持した。
