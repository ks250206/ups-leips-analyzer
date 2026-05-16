# Iteration 118: Project store dataset test split

## Purpose

Dataset操作系のテストを専用ファイルへ移し、巨大だった `projectStore.test.ts` を撤去する。

## Implemented

- `projectStore.test.ts` を `projectStoreDatasets.test.ts` へリネームした。
- demo load、dataset add/import/delete、role change、auto-select、LEET/LEIPS初期range、UPS IP multi-selectのテストをdataset selection系として独立させた。
- production codeは変更していない。

## TODO

- docsへstore test分割後の責務を追記する。
- 最終ゲートでGo binary smokeまで確認する。

## Simplifications / technical debt

- テスト本文は前iterationで縮小済みのdataset系テストをそのまま維持した。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
