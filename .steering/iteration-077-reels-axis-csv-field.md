# Iteration 077: REELS Axis and CSV Field

## Purpose

REELS Plotの横軸方向とData BrowserのCSV file field操作を修正する。

## Implemented

- REELS Plotのx軸をreverseにし、左が+側、右が-側になるようにした。
- `Load CSVs`を`label`依存から`div role="button"` + hidden input direct clickへ変更した。
- CSV fieldのpointer downを止め、window drag/focus処理に拾われにくくした。
- REELS軸方向をUI testとdocsに固定した。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- Browser check: `REELS plot`の`data-x-direction="reverse"`と`Load CSVs`の`role="button"`を確認。

## TODO

- file picker自体はOS UIのため自動検証していない。DOM上のclick target変更まで確認済み。

## Simplifications / Debt

- CSV input自体はhidden inputのまま維持する。drag & drop対応は後続。
