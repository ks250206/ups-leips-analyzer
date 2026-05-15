# Iteration 066: Band Annotation Arrow Labels

## Purpose

Band Diagram annotationのデフォルト値、矢印方向、plot label表記を微調整する。

## Implemented

- Band Diagramのannotation control defaultを`Font 30`、`Arrow 0.7`に変更した。
- Band Diagramの`UPS`/`LEIPS` annotationの白縁を広げ、series上でも読みやすくした。
- `IP`と`EA`の矢印は左側だけに矢尻を表示するようにした。`Eg`は従来通り両矢尻を維持した。
- `LEIPS vs Energy from Evac.`のX軸ラベルを`E` + 下付き`vac.`で描画するようにした。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`

## TODO

- annotationの白塗り範囲はstroke幅で広げている。矩形背景のほうが制御しやすい場合は後続で置き換える。

## Simplifications / Debt

- `E_vac.`表記は`SpectrumPlotParts`内のラベル文字列判定で描画を分岐している。
