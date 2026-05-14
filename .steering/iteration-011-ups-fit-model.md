# Iteration 011 - UPS fit model

## Purpose

- UPS解析をVB setとIP setに分け、VB setはEF-EVBM、IP setはIP算出用のEVBM/Ecut-offを求める形にする。

## Implemented

- `FitTarget`と`FitRanges`に`ups-ip-vbm-edge`/`ups-ip-vbm-bg`を追加。
- `UPSResult`を`vbEvbm`、`ipEvbm`、`efMinusEvbm`、`ecutoff`、`ip`に分離。
- `calculateUPSResult`をVB setのEVBMとIP setのEVBM/Ecut-offを別々にfitする形へ変更。
- `IP = photonEnergy - (Ecutoff - ipEvbm)`で計算する。
- Demo UPS IP datasetにEVBM領域とEcut-off領域を含めた。
- 旧Project JSON読み込み時に新規fit rangeを`DEFAULT_FIT_RANGES`で補完する軽量マイグレーションを追加。

## TODO

- UPS IPウィンドウへIP EVBM範囲カーソルを表示する。
- Analysis ControlsのUPSタブをVB set/IP setに分ける。

## Simplifications / Debt

- 保存済みIndexedDB内の古いProjectはimport時のみ補完される。DB loadの汎用マイグレーションは未実装。

## Verification

- Passed: `vp check`
- Passed: `vp test --coverage` (27 tests, all-file line coverage 97.99%)
