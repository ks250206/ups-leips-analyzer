# Iteration 122: Utility window toggle menu

## Purpose

Help window と Project List window をTopBarのWindows menuと背景右クリックcontext menuの両方から開閉できるようにする。

## Implemented

- Windows menuに `Show/Hide Help` と `Show/Hide Project List` を状態付きで表示するようにした。
- 背景context menuもTopBarと同じmenu definitionを使うため、同じ項目が表示される。
- Store testでHelpとProject Listのtoggleを固定した。
- App testでTopBar Windows menuと背景context menuからの開閉を固定した。

## TODO

- なし。

## Simplifications / technical debt

- utility windowの表示状態は従来通りProject `windows` 配列への追加/削除で扱う。

## Tests

- `vp check`
- `vp test --coverage`（初回は既存App menu testが1件失敗、直後の再実行で123 tests passed）
- `vp build`
