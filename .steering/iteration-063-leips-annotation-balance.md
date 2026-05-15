# Iteration 063: LEIPS Annotation Balance

## Purpose

LEIPS Plotのannotation文字とbandpass矢印が大きすぎるため、plot内のスペクトルとmarkerを邪魔しないサイズへ調整する。

## Implemented

- `LEET(der)` / `LEET` / `LEIPS` annotationを22pxへ縮小した。
- bandpass矢印ラベルを18pxへ縮小した。
- bandpass矢印の線幅を1.8pxへ落とし、矢印headも少し細くした。
- `PlotAnnotation`に`strokeWidth`を追加し、矢印ごとに線幅を指定できるようにした。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`

## TODO

- 実データごとの重なりが目立つ場合は、annotation位置をplot domain依存で自動配置する。

## Simplifications / Debt

- 今回は見た目のバランス調整に限定し、annotation位置の自動最適化は入れていない。
