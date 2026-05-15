# Iteration 054: Band Annotation and Viewport Persistence

## Purpose

Band DiagramのUPS/LEIPS annotationの可読性を上げ、別windowのcursor変更後にBand Diagramのplot範囲が勝手に戻る問題を直す。

## Implemented

- Band Diagramの`UPS`/`LEIPS` annotationに白いstroke haloを付け、曲線と重なっても読めるようにした。
- Band Diagramのviewport初期化条件を、`band` objectの差し替わりではなく、UPS/LEIPS点列のsignature変化に限定した。
- `bandPlotDataSignature`を追加し、IP/EA/Egなどannotation値だけが再計算で変わってもsignatureが維持されることをunit testで固定した。
- LEIPS点列のX座標が変わる場合はsignatureが変わり、必要な自動初期化が入るようにした。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- `curl -I http://127.0.0.1:4199/`
- `curl -I http://127.0.0.1:4199/assets/index-CAIBmUPw.css`
- Browser smoke: `http://127.0.0.1:5173/`でapp titleとBand Diagram window表示を確認

## TODO

- 実データでLEIPS vs Energy cursor変更後にBand Diagramのzoom範囲が保持されることを目視確認する。

## Simplifications / Debt

- Signatureは点数、X min/max、X sumで判定する。完全な全点hashではないが、今回のviewport reset判定には十分な軽量実装とする。
