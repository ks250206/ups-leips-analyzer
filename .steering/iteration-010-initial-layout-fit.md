# Iteration 010 - initial layout fit

## Purpose

- LEIPS Evacウィンドウ追加後も、標準的な1080px高の画面で主要ウィンドウが初期表示に収まるようにする。

## Implemented

- LEIPS raw/LEIPS Evacの初期高さを320pxへ調整。
- Band Diagramを`y=720`, `height=300`へ移動し、初期表示の下端からはみ出しにくくした。

## TODO

- 画面サイズごとに初期レイアウトを計算するresponsive layout seed。

## Simplifications / Debt

- まだ固定座標ベース。狭い画面では重なりやはみ出しが残る可能性がある。

## Verification

- Passed: `vp check`
- Passed: `vp test --coverage` (27 tests, all-file line coverage 97.95%)
