# Iteration 013 - fit line extrapolation

## Purpose

- 線形fitの計算範囲はカーソル範囲のまま維持し、描画線だけを対象プロットのX範囲全体まで外挿する。

## Implemented

- `lineFitSeries`に描画用`extent`を追加。
- `xExtent` helperを追加。
- UPS VB/IPとLEIPS Evacの線形fit線をdatasetまたは変換後seriesのX min/maxまで描画。
- fit線外挿のunit testを追加。

## TODO

- SVG export側の軸方向反転は未対応。画面表示のuPlotとは別経路なので後続で揃える。

## Simplifications / Debt

- Band Diagramには線形fit線がないため、このイテレーションでは外挿対象なし。

## Verification

- Passed: `vp check --fix`
- Passed: `vp test --coverage` (29 tests, all-file line coverage 97.99%)
- Passed: `vp build`
- Passed: `pnpm binary:build`
- Passed: `curl -I http://127.0.0.1:4187/`
- Passed: `curl -I http://127.0.0.1:4187/assets/index-DjZ8mLRQ.js`
