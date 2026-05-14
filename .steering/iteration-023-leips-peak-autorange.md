# Iteration 023: LEIPS Peak Autorange

## Purpose

LEIPS PlotでLEET(der)のGaussian peak fitが初期range外になり、LEIPS vs Energy from Evac. とBand Diagramへ進めなくなる問題を減らす。

## Implemented

- CSV/import dataset追加時に、読み込まれた`leet-der` datasetの最大強度点を検出。
- `leetDerPeak` fit rangeを最大強度点中心の幅1 eVへ自動設定。
- データ範囲が1 eV未満の場合はdataset全体範囲へclamp。
- shifted peak datasetでも初期cursorが最大強度点周辺に来るstore testを追加。

## TODO

- LEIPS edge/BG rangeも、vacuum変換後のLEIPS曲線に応じた自動初期化を検討する。
- Gaussian peakだけ成功し、LEIPS edge/BGが失敗した場合にも、変換済みLEIPS raw curveだけ表示できるpartial result設計を検討する。

## Scope

- 今回はLEET(der) peak cursorの初期値自動化に限定。
- LEIPS onset/BGの自動推定は後続iterationで扱う。

## Tests

- Passed: `vp check --fix`
- Passed: `vp test --coverage`
- Passed: `vp build`
- Passed: `pnpm binary:build`
