# Iteration 053: Band Controls and Autoscale Performance

## Purpose

Band Diagramの下部UIを整理し、Auto scale計算による操作の重さを減らす。

## Implemented

- Band Diagram下部controlをfull-width入力ではなく、固定幅のcompact controlが横に並ぶlayoutへ変更した。
- X範囲入力も固定幅にし、不要に2列いっぱいへ広がらないようにした。
- Auto/double click reset用のdomain計算を、`createIgorBandModel`経由ではなくpath生成を伴わない軽量helperに変更した。
- UPS/LEIPS点のscale/percent offset変換を`transformBandPoints`へ分離した。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- `curl -I http://127.0.0.1:4199/`
- `curl -I http://127.0.0.1:4199/assets/index-*.js`
- Browser smoke: app renders and Band Diagram window is present.

## TODO

- 実データ表示状態でBand Diagram controlの見切れとoffset操作の体感を確認する。

## Simplifications / Debt

- Control layoutはまず固定幅+wrapで整理した。将来、Band Diagram専用side panelへ移す余地は残す。
