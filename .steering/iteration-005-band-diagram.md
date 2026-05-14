# Iteration 005 Band Diagram

## Goal

UPS VBと真空準位基準LEIPSからUPS-LEIPSバンド図を作る。

## Implemented

- Band Diagram window。
- `Energy relative to Ef/eV` 軸でUPS/LEIPSを表示。
- VBM、CBM、vacuum level markerとIP/EA/Eg summaryを描画。
- `Eg = IP - EA`。
- 各plot windowにPNG/SVG exportを追加。
- fit範囲をplot上の半透明range bandとして表示。

## TODO

- IGORに近い矢印注記。
- IGORに近い出版用レイアウトの微調整。

## Simplifications

- uPlot marker描画は縦線とラベル中心。矢印寸法線は未実装。

## Tests

- band diagram座標とEg計算。
