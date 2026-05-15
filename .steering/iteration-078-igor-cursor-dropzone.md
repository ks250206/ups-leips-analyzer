# Iteration 078: Igor Cursor Markers and CSV Dropzone

## Purpose

IgorPro風のpoint cursor表示modeを追加し、Data BrowserのCSV load fieldをクリック/ドロップ可能にする。

## Implemented

- `SpectrumPlot`のcontext menuに`Use point cursors` / `Use range cursors`を追加した。
- point cursor modeではrange endpointsをseries上のA/B/C/D markerとして表示し、marker dragで既存fit rangeを更新できるようにした。
- range cursor modeとhide cursor range modeは既存挙動を維持した。
- `Load CSVs` fieldを実file input overlayつきdropzoneに変更し、clickとdrag/dropの両方で`handleFiles`へ渡すようにした。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- Browser check: `Load CSV files` inputが`type=file`、`multiple`、absolute overlayになっていることを確認。

## TODO

- OS file pickerとFinder drag/dropはブラウザ自動化では完了確認できないため、次回手動で実ファイル投入を確認する。

## Simplifications / Debt

- point cursorのY位置は対象fit rangeに対応する代表seriesから補間する。複数seriesの厳密なcursor割当は必要になった時点で拡張する。
