# Iteration 117: Project store analysis test split

## Purpose

解析、model normalization、Project UI state、window geometry系のテストをdataset selection系から分離する。

## Implemented

- `projectStoreAnalysis.test.ts` を追加した。
- fit range、LEIPS error isolation、bandpass、UPS IP per-dataset state、Band IP source、legacy migration、cursor/sample info、viewport/window geometryのテストを移した。
- `projectStore.test.ts` はdataset selection系のテストだけに縮小した。

## TODO

- dataset selection testsを専用名へ移し、`projectStore.test.ts` を削除する。

## Simplifications / technical debt

- テスト本文は移動のみ。production codeは変更していない。
- `projectStoreAnalysis.test.ts` は377行で300行を超えている。analysis/model/UI state/window geometryを同じ意味単位としてまとめたため、今回の分割ではこれ以上細かくしない。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
