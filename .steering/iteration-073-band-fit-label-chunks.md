# Iteration 073: Band Precision, Fit Labels, and Chunks

## Purpose

Band Diagramの有効数字表示とauto scale、cursor非表示時fit label位置、production chunk分割を調整する。

## Implemented

- `formatSignificant`が指定有効数字の末尾0を維持するようにした。
- Band Diagramのauto scaleは表示用の倍率/offsetではなく、raw dataの1x/0% domainでrangeを決めるようにした。
- Cursor range非表示時のfit線labelを、可視線分中央ではなく可視範囲の左/右端へ寄せるようにした。
- `build.rolldownOptions.output.codeSplitting.groups`を追加し、React系とdata/store系vendor chunkを分離した。
- production buildの最大chunkは約190kBになり、large chunk warningは出ない状態にした。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- `curl -I http://127.0.0.1:4187/`
- `curl -I http://127.0.0.1:4187/assets/react-vendor-DRTYvtHH.js`

## TODO

- なし。

## Simplifications / Debt

- Fit labelの端寄せはxScale上の左端へ寄せる。反転軸ではデータ値として高い側/低い側ではなく画面端基準になる。
- D3系は現状のbundle構造だと個別chunkに分ける効果が薄かったため、React系とdata/store系の低リスク分割に留めた。
