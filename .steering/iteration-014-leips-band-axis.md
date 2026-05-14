# Iteration 014 - LEIPS and band axes

## Purpose

- LEIPS raw、LEIPS Evac、Band DiagramのX軸を右が小さく左が大きい向きに揃える。
- LEIPS raw plotではLEIPSスペクトルを右Y軸に分離して表示する。

## Implemented

- `PlotSeries`に`yAxis`を追加。
- `SpectrumPlot`に右Y軸を追加し、`yAxis: "right"`の系列を`y2` scaleへ割り当てる。
- LEIPS raw plotのLEIPS datasetを右Y軸へ移動。
- Band Diagramを`xDirection="reverse"`へ変更。

## TODO

- SVG exportは右Y軸とX軸反転をまだ反映していない。

## Simplifications / Debt

- 右Y軸ラベルはLEIPS raw plotだけで指定している。汎用plotごとの細かい軸色・単位設定は後続。

## Verification

- Passed: `vp check`
- Passed: `vp test --coverage` (29 tests, all-file line coverage 97.99%)
- Passed: `vp build`
- Passed: `pnpm binary:build`
- Passed: `curl -I http://127.0.0.1:4187/`
- Passed: `curl -I http://127.0.0.1:4187/assets/index-BJ-XFqfH.js`
