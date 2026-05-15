# Iteration 067: Fit Label Clamp and Band Significant Digits

## Purpose

Fit線captionのはみ出しを抑え、Band Diagram annotationの数値表示桁数をUIから調整できるようにする。

## Implemented

- Hide cursor ranges時に表示するfit線labelを、現在の可視X範囲とplot矩形内へclampするようにした。
- Fit線label位置は、拡大後の可視範囲内にある線分中央を基準に計算するようにした。
- Band Diagram control stripへ`Sig`入力を追加し、annotationの`IP`、`EA`、`Eg`、`Vacuum level`を有効数字指定で表示できるようにした。
- 有効数字は`1..8`へ丸めて、defaultは`4`にした。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- in-app browser reload smoke (`http://127.0.0.1:5173/`)

## TODO

- Project保存対象にはまだ含めていない。必要ならBand Diagram表示設定として保存対象にする。

## Simplifications / Debt

- fit labelの横幅は文字数ベースの概算でclampしている。厳密なSVG text計測は未実装。
