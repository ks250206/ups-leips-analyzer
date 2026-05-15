# Iteration 079: Toasts, LEIPS Point Cursor, and REELS Eg Arrow

## Purpose

Project入出力とCSV loadの成功/失敗をtoastで通知し、LEIPS point cursorをLEET(der) spectrumへ載せる。REELS plotには0 eV基準線からEgへ向かう横矢印を追加する。

## Implemented

- global toast storeと`ToastViewport`を追加した。
- Project save / save as / load / import / exportで成功または失敗toastを出すようにした。
- Data BrowserのCSV load成功/失敗でtoastを出すようにした。
- LEIPS plotのpoint cursor代表seriesをLEET(der) datasetへ明示的に割り当てた。
- REELS plotに0 eV markerと`Eg` horizontal arrow annotationを追加した。

## Tests

- CSV upload後のtoast表示をcomponent testに追加した。
- Demo表示時にREELS Eg annotationが存在することをcomponent testに追加した。
- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- Browser check: `http://127.0.0.1:5174/`でappが起動し、`Load CSV files` inputが存在することを確認。

## TODO

- toastの文言と表示位置は、実機操作で邪魔になる場合に微調整する。

## Simplifications / Debt

- toastは軽量実装で、通知履歴やUndoは持たない。
- REELS Eg arrowは既存`SpectrumPlot`のx-arrow annotationを流用している。
