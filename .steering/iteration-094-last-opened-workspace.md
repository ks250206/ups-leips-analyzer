# Iteration 094: Last Opened Workspace Restore

## Purpose

前回最後に開いていたCatalog/Projectをユーザー環境ごとに復元し、削除済みの場合は安全にDefault Catalogの空Projectへfallbackする。

## Implemented

- `src/store/lastOpenedWorkspace.ts`を追加し、last opened Catalog/Project IDを`localStorage`へ保存するようにした。
- `Workspace`起動時にlast opened参照を読み、Catalog/Projectが存在すれば復元するようにした。
- 復元完了前にdefault stateでlocalStorageを上書きしないよう、restore完了後だけ現在のCatalog/Project IDを保存するようにした。
- CatalogまたはProjectが削除済みの場合はtoast errorを出し、Default Catalogの空Projectへfallbackするようにした。
- store testでlast opened復元を確認した。
- App testで削除済みlast opened参照のfallback toastと空Project表示を確認した。

## TODO

- 起動中に別タブでCatalog/Projectが削除された場合の同期は後続で扱う。

## Simplifications / Debt

- 保存対象はIDだけ。Catalog名/Project名はDexie側から読み直す。
- 未保存ProjectはProject IDを保存せず、Catalogだけを復元する。

## Tests

- `vp check --fix`
- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- Go binary smoke: `/` and built `/assets/...`
- Browser smoke: app opens and shows Default Catalog / UPS-LEIPS Project after startup.
