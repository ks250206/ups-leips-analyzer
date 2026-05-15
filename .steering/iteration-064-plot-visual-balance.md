# Iteration 064: Plot Visual Balance

## Purpose

LEIPS Plot annotationをさらに小さくし、cursor range非表示時の境界線を消し、plot枠線とBand Diagram window初期高さを調整する。

## Implemented

- LEIPS Plotの`LEET(der)` / `LEET` / `LEIPS` annotationを16pxへ縮小した。
- bandpass矢印ラベルを14px、線幅を1.2pxへ縮小した。
- `Hide cursor ranges`時にrange bandの塗りだけでなくcursor境界線も非表示にした。
- SpectrumPlotのplot area border/tick/text色を黒へ変更した。
- Band Diagram windowのdefault heightを350から460へ増やした。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`

## TODO

- Annotation位置の自動配置は未実装。重なりが残る場合はplot domainとwindow sizeから位置を決める。

## Simplifications / Debt

- plot枠線の黒化はSpectrumPlot共通axis colorで行い、Band Diagram専用SVGには変更を入れていない。
