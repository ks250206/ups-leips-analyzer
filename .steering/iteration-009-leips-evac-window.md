# Iteration 009 - LEIPS Evac window

## Purpose

- LEIPSの生データ表示と真空準位基準表示を分ける。
- LEIPSスペクトルが一部点線状に見える問題を修正する。

## Implemented

- `WindowLayout.kind`に`leips-evac`を追加。
- `LEIPS Plot`は`LEET / LEET(der) / LEIPS`のApplied Bias基準グラフに整理。
- `LEIPS vs Energy from Evac.`ウィンドウを追加し、真空準位基準LEIPS、edge/BG fit、EA markerを表示。
- LEIPS側にもA/B/C/Dカーソルを割り当て、LEET(der) peakとLEIPS edge/BGをドラッグ更新可能にした。
- `SpectrumPlot`のuPlot seriesで`spanGaps: true`を使い、複数系列のXグリッド差による線切れを抑制。

## TODO

- 保存済みIndexedDBプロジェクトへ新規`leips-evac`ウィンドウを自動追加するマイグレーション。
- Band Diagramの初期位置は縦に下げたため、狭い画面向けの初期レイアウト再調整。

## Simplifications / Debt

- LEIPS raw plotではLEIPS強度とLEET強度を同じY軸に載せている。必要なら後続でY軸スケール分離を検討する。

## Verification

- Passed: `vp check`
- Passed: `vp test --coverage` (27 tests, all-file line coverage 97.95%)
- Passed: `vp build`
- Passed: `pnpm binary:build`
- Passed: `curl -I http://127.0.0.1:4187/`
- Passed: `curl -I http://127.0.0.1:4187/assets/index-Caekqb8Y.js`
