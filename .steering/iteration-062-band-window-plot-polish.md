# Iteration 062: Band/Window/Plot Polish

## Purpose

Band Diagram viewport保存、window reset操作、Analysis tab同期、plot cursor range toggle、LEIPS annotation/custom bandpass modalを追加する。

## Implemented

- `ProjectSnapshot.ui.bandDiagramViewport`を追加し、Band Diagramの拡大状態をProject stateへ保存・復元するようにした。
- Band Diagramのplot aspectを4:3へ寄せ、X tick font sizeを上げた。
- Analysis Controlsの初期tabをDataにし、UPS/LEIPS/Band/Data window focusに応じて関連tabへ同期するようにした。
- 各window context menuに`Reset window position` / `Reset window size`を追加した。
- Windows menuに全window position/size resetと、window別のbring-to-front/reset submenuを追加した。
- UPS IP marker labelを`EVBM`から`VBM`へ変更した。
- `SpectrumPlot` context menuにcursor range表示toggleを追加した。
- LEIPS Plotに`LEET(der)` / `LEET` / `LEIPS` annotationと、EpeakからVacuum levelまでのbandpass矢印を追加した。
- LEIPS Plotの`Filter > Custom band pass`をmodal入力にした。
- `docs/05-ui-workflows.md`と`docs/06-architecture.md`へUI state/操作仕様を追記した。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- `./bin/ups-leips-analyzer -port 4199` smoke:
  - `curl -I http://127.0.0.1:4199/` returned `200 OK`
  - `curl -I http://127.0.0.1:4199/assets/index-Bg-plb8e.css` returned `200 OK`

## TODO

- Band Diagram viewport以外のplot viewport保存は後続で扱う。
- LEIPS annotation位置は固定fractionで置いているため、極端なwindow sizeでは微調整余地がある。

## Simplifications / Debt

- Custom bandpass modalはLEIPS Plot内の軽量modalとし、共通modal基盤への統合は後続に回した。
- Cursor range toggleはplotごとのlocal UI stateで、Project保存対象にはしていない。
