# Iteration 015 - LEIPS band axis fix

## Purpose

- LEIPS raw、LEIPS Evac、Band DiagramのX軸反転をテストで固定する。
- Band DiagramのLEIPS横軸をIgorProと同じEf基準式として明示する。

## Implemented

- `createSpectrumPlotOptions`を追加し、uPlot options生成をunit test可能にした。
- `xDirection="reverse"`で`scales.x.dir = -1`、normalで`1`になるunit testを追加。
- `SpectrumPlot` rootに`data-x-direction`を追加し、LEIPS raw、LEIPS Evac、Band Diagramのreverse指定をUI smoke testで固定。
- `convertLeipsEvacToEfEnergy`を追加し、`LEIPS_Ef = LEIPS_Evac + EFMinusEVBM - IP`を明示。
- Band DiagramのLEIPS点生成を上記helper経由に変更。

## TODO

- SVG exportのX軸反転と右Y軸出力は未対応。

## Simplifications / Debt

- データ配列は昇順のまま維持し、表示反転はuPlot scale directionで行う。

## Verification

- Passed: `vp check`
- Passed: `vp test --coverage` (32 tests, all-file line coverage 97.99%)
- Passed: `vp build`
- Passed: `pnpm binary:build`
- Passed: `curl -I http://127.0.0.1:4187/`
- Passed: `curl -I http://127.0.0.1:4187/assets/index-CyNsfNMG.js`
