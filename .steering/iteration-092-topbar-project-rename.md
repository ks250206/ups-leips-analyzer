# Iteration 092: TopBar Contrast and Project Rename

## Purpose

TopBarのCatalog/Project/Sample情報の視認性を上げ、Project名をIDを維持したまま変更できる操作を追加する。

## Implemented

- TopBar badgeの文字色を明るくし、label/valueともに暗い灰色文字を避ける配色へ変更した。
- `Projects > Rename Project`を追加し、modalから現在Project名を変更できるようにした。
- Rename Projectは現在Project IDを維持する。保存済みProjectの場合は同じrecordへ保存し、未保存Projectの場合は画面上の名前だけ変更して未保存状態を維持する。
- store testでProject IDを維持したrename保存を確認した。
- UI testでProjects menuとRename Project modalを確認した。
- `docs/05-ui-workflows.md`へTopBar badgeとRename Project仕様を追記した。

## TODO

- TopBarのbadgeがさらに増えた場合の折り返し・省略表示は後続で調整する。

## Simplifications / Debt

- Rename Projectで別Projectと同じ名前を指定した場合はエラーにする。上書き統合はSave as ...の責務として分ける。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- Go binary smoke: `/` and built `/assets/...`
- Browser smoke: TopBar badge class/text and `Projects > Rename Project` modal.
