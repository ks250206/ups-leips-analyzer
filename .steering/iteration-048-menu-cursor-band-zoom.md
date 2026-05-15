# Iteration 048: menu, cursor, and Band Diagram zoom polish

## Purpose

- Cursor表示を簡素化し、メニュー操作をProject/View/Windows/Helpへ整理する。
- Band Diagram専用SVGにも他plot相当のズーム/パン操作を追加する。

## Implemented

- Range band labelから`active`を削除し、A/B/C/Dなどのcursor handle badgeも非表示にした。
- TopBarに`Project`、`View`、`Windows`、`Help` menuを追加。
- 背景右クリックmenuをTopBarと同じmenu構成にした。
- `Project > Delete project`を追加し、現在ProjectのDexie保存レコードを削除して空Projectへ戻すstore APIを追加。
- `View > Reset view`を追加し、workspaceの位置と拡大率を初期値へ戻せるようにした。
- `Windows` menuから各windowを最前面へ移動できるようにした。
- `Help > About UPS-LEIPS Analyzer`で簡易ヘルプを表示するようにした。
- Band Diagramに通常drag zoom、wheel Y zoom、Shift+wheel X zoom、Alt+wheel/Alt+drag pan、double click reset、context menu resetを追加。
- `docs/05-ui-workflows.md`と`docs/07-testing-and-release.md`を更新。

## Tests

- Cursor labelに`active`が出ないこと、A/B cursor labelがないことをUI testで確認。
- TopBar menuと背景context menuの主要項目をUI testで確認。
- `deleteCurrentProject`の保存済みProject削除と空Project復帰をstore testで確認。
- Band Diagramのreverse axis、wheel zoom、drag zoomをunit testで確認。

## Done

- 計画範囲のUI polish、Project削除、Band Diagram zoomを実装済み。

## TODO

- `Windows` menuは前面化のみ。window show/hideや整列は後続。
- `Help`は軽量alert。専用Help windowやドキュメントリンクは後続。

## Technical Debt / Shortcuts

- Band DiagramのviewportはProject JSONへ保存していない。
- TopBar menuはportal型context menuを再利用しており、専用のmacOS風menu bar挙動ではない。
