# Iteration 115: Project store test utilities

## Purpose

`projectStore.test.ts` 分割の前段として、共通fixtureとstore reset処理をtest helperへ集約する。

## Implemented

- `projectStoreTestUtils.ts` を追加した。
- default catalog + demo load reset、fit target一覧、demo dataset prefix clone、UPS IP result fixtureをhelper化した。
- `projectStore.test.ts` は一時的に残し、共通fixtureだけをhelper経由へ置き換えた。

## TODO

- lifecycle/catalog testsを別ファイルへ移す。
- analysis/model/ui-state testsを別ファイルへ移す。
- dataset selection testsを別ファイルへ移し、元の巨大testを削除する。

## Simplifications / technical debt

- helper導入のみ。テスト内容と期待値は変更していない。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
