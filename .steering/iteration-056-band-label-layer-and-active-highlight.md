# Iteration 056: Band Label Layer and Active Highlight

## Purpose

Band Diagramのannotation可読性とfont controlの追従を改善し、window active highlightの色をmono系に寄せる。

## Implemented

- Band Diagramの`UPS`/`LEIPS` annotationをseries pathより後に描画し、白いstroke haloでseriesを隠せる積層順にした。
- `UPS`/`LEIPS` annotationの白strokeを少し太くした。
- Band Diagramの`VBM`、`CBM`、`Vacuum level`縦ラベルをFont入力に追従させた。
- `Eg`の`g` subscript font sizeを固定値ではなくFont入力に比例させた。
- active window highlightをcyan/green寄りからslate mono系のborder/ring/shadowへ変更した。
- SSoTとして`docs/05-ui-workflows.md`を更新した。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- `curl -I http://127.0.0.1:4199/`
- `curl -I http://127.0.0.1:4199/assets/index-DrPeCJNt.js`
- Browser smoke: `http://127.0.0.1:5173/`でapp titleとBand Diagram window表示を確認

## TODO

- Demo dataでBand Diagramのannotation halo、Font入力によるVBM/CBM/Vacuum/Eg subscriptの見た目を目視確認する。

## Simplifications / Debt

- annotation haloはSVGの`paintOrder="stroke fill"`による白strokeで実装する。ラベル専用の背景rectは追加していない。
