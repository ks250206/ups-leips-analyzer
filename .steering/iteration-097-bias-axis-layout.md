# Iteration 097: Bias axis label and workspace layout

## Purpose

- UPS Bias DependenceのY軸ラベル表記をIgor寄りにし、通常plotの余白を詰める。
- Workspace上でwindowを動かせる範囲を広げ、下方向の配置余地を増やす。
- 初期配置でUPS Bias Dependenceを2行目へ移動する。

## Implemented

- `Binding energy of Ecut-off / eV`の`cut-off`をSVG軸ラベル内で下付き表示するようにした。
- `Binding energy of EVBM / eV`の`VBM`をSVG軸ラベル内で下付き表示するようにした。
- 通常plotのtop marginを`32 -> 20`、left marginを`92 -> 78`へ縮小した。Band DiagramとLEIPS用marginは維持。
- Workspace planeを`2400px x 2400px`に広げ、window drag boundsの下方向余地を増やした。
- default layoutで`UPS Bias Dependence`を2行目に配置し、LEIPS/LEIPS Evac、Band/REELSを下へ送った。
- 旧ProjectでBias windowが旧配置/旧幅の場合、normalize時に新しい2行目・2-grid幅へ移行するようにした。

## Tests

- Updated SpectrumPlot geometry tests for compact normal margins.
- Added expectation that legacy UPS Bias window normalization moves to row 2.
- Ran `vp check --fix`.
- Ran `vp test --coverage`.
- Ran `vp build`.
- Ran `pnpm binary:build`.
- Ran Go binary smoke for `/` and `/assets/...`.

## Coverage

- Statements: 95.48%
- Branches: 80.30%
- Functions: 97.88%
- Lines: 95.40%

## TODO / Debt

- Axis label subscript handling is string-match based. If more scientific labels need subscripts, extract a small label-token renderer.
