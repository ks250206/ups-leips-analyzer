# Iteration 002 Workbench

## Goal

マルチウィンドウGUI基盤、Data Browser、仮想Table、Project永続化を作る。

## Implemented

- `react-rnd` によるドラッグ/リサイズ可能なWindowFrame。
- Data BrowserでCSV読み込み、demo再読み込み、Project JSON export/import。
- TanStack Table + TanStack Virtualによるdataset table。
- Zustand storeとDexie databaseを追加。

## TODO

- 保存済みProject一覧と削除UI。
- Undo/redo。

## Simplifications

- Project保存は明示的なSaveボタンのみ。自動保存は未実装。

## Tests

- Project JSON roundtrip。
- fake-indexeddbでDexie save/load/list/delete。
- Zustand actions。
