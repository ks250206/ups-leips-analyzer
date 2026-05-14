# Iteration 003 UPS

## Goal

VB/IP CSVをplotし、edge/BG線形fitからVBM、cut-off、IPを計算する。

## Implemented

- UPS plot window。
- VB/IP dataset割当。
- uPlot selectionをactive fit rangeへ反映。
- VBM、cut-off、IP結果表示。
- fit lineとmarker描画。

## TODO

- IGORのカーソルA-Hに近いプリセットボタン。
- 実測値に合わせた初期fit範囲推定。

## Simplifications

- v1ではfit範囲を数値入力とplot drag selectionで扱う。

## Tests

- IP式、線形fit、交点、demo UPS解析。
