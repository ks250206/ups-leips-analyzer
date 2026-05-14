# Iteration 008 - draggable fit cursors

## Purpose

- Igor ProのA/B/C/Dカーソルに近い形で、fit範囲の端点をグラフ上で直接ドラッグできるようにする。

## Implemented

- `PlotRangeBand`に`id`と`cursorLabels`を追加。
- `SpectrumPlot`に範囲端点のHTML overlay cursorを追加。
- カーソルドラッグ時にuPlot座標からX値へ変換し、対応するfit rangeを更新する。
- UPS VB/IPのedge/BG範囲へA/B/C/Dカーソルを割り当て。
- uPlot seriesに`spanGaps: true`を設定し、複数Xグリッド混在時の線切れを減らす下地を入れた。

## TODO

- LEIPS/LEETにも同じカーソル操作を割り当てる。
- カーソルラベルの重なり回避は未実装。

## Simplifications / Debt

- ドラッグ中はReact state経由で再描画するため、巨大データでは最適化余地がある。
- カーソルはfit範囲バンドの端点として扱い、独立した自由カーソル管理はまだ持たない。

## Verification

- Passed: `vp check --fix`
- Passed: `vp test --coverage` (27 tests, all-file line coverage 97.95%)
