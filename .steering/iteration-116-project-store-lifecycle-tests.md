# Iteration 116: Project store lifecycle test split

## Purpose

Project/Catalog persistence系のテストを `projectStore.test.ts` から分離する。

## Implemented

- `projectStoreLifecycle.test.ts` を追加した。
- Project save/load/save-as/rename/delete、Catalog create/switch/rename/delete/export/import、last-opened restore、default DB saveのテストを移した。
- `projectStore.test.ts` から移動済みテストと不要importを削除した。

## TODO

- analysis/model/ui-state testsを別ファイルへ移す。
- dataset selection testsを別ファイルへ移して、元の巨大testを削除する。

## Simplifications / technical debt

- テスト本文は移動のみ。期待値は変更していない。

## Tests

- `vp check --fix`
- `vp test --coverage`
- `vp build`
