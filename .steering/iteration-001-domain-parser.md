# Iteration 001 Domain Parser

## Goal

MultiPak CSV parser、ドメイン型、UPS/LEIPS解析の純粋関数を作る。

## Implemented

- `SpectrumDataset`、`FitRange`、`LineFitResult`、`GaussianFitResult`、`UPSResult`、`LEIPSResult`、`BandDiagramResult` を追加。
- MultiPak CSVを複数datasetへ展開するparserを追加。
- 線形fit、交点計算、ガウスfit、bandpass、真空準位変換、IP/EA/Eg計算を追加。
- `sample/` に依存しない合成demo datasetとtest fixtureを追加。

## TODO

- `.spe` バイナリparserは後続。
- 実測データでfit範囲の初期推定を改善する。

## Simplifications

- ガウスfitは重心初期値 + Gauss-Newton反復。

## Tests

- `vp check`
- `vp test`
- `vp test --coverage`
