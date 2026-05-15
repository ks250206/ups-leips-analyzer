# Iteration 065: Plot Label Spacing

## Purpose

Cursor range非表示時のfit label、LEIPS annotation位置、plot axis label余白、Band Diagram tick/Y label位置を調整する。

## Implemented

- `PlotSeries.fitLabel`を追加し、`Hide cursor ranges`時にfit線へ`VBM edge`などのrange labelを表示するようにした。
- Cursor range非表示時はrange band/handle境界線は出さず、fit線とfit labelだけを表示する。
- `LEET(der)` annotationを左側へ寄せた。
- Band Diagram以外のplotでX軸ラベルを少し下へ移動し、tickとの余白を増やした。
- Band DiagramのX tick文字を大きくし、Y軸ラベルを軸側へ近づけた。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`

## TODO

- fit label位置はfit線の中央点に固定している。重なりが出る場合はlabel collision回避を追加する。

## Simplifications / Debt

- Cursor range表示toggleはProject保存対象外のlocal stateのまま維持した。
