# Iteration 016 - load selection and band axes

## Purpose

- CSV読み込み時にdemo datasetから読み込みdatasetへ自動で解析対象を切り替える。
- Band DiagramのUPS/LEIPSを左右Y軸へ分離し、両Y軸の数値とtickを非表示にする。
- LEIPS raw / LEIPS EvacのX軸反転指定を維持し、テストで固定する。

## Implemented

- `addDatasets`時のauto selectionで、同じkindの読み込みdatasetをdemoより優先するように変更。
- Band Diagramの`UPS` seriesを左Y軸、`LEIPS` seriesを右Y軸へ割り当て。
- `SpectrumPlot`に`hideYTicks`を追加し、Y軸のtickと数値を消せるようにした。
- Band Diagramで`yLabel="UPS"`、`yRightLabel="LEIPS"`、`hideYTicks`を指定。
- 自動切替、Band Diagram右軸、Y tick非表示のunit testを追加。

## TODO

- LEIPS rawのX軸反転はuPlot `scales.x.dir = -1`で固定済み。実画面で古いbundleが残る場合はブラウザreloadが必要。

## Simplifications / Debt

- Y軸の軸線自体は残す。非表示にするのは数値、tick、grid。

## Verification

- Passed: `vp check --fix`
- Passed: `vp test --coverage` (35 tests, all-file line coverage 97.68%)
- Passed: `vp build`
- Passed: `pnpm binary:build`
- Passed: `curl -I http://127.0.0.1:4187/`
- Passed: `curl -I http://127.0.0.1:4187/assets/index-4bW0zXOa.js`
