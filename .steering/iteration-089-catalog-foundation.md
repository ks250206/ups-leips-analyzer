# Iteration 089: Catalog Foundation

## Purpose

Projectの上位概念としてCatalogを追加し、Catalogごとに独立したProject DBを持てる保存基盤を作る。

## Implemented

- Catalog registry用Dexie DBと`CatalogRecord`を追加した。
- Catalogごとに`ups-leips-catalog-${catalogId}`のProject DBを作るようにした。
- 既存`ups-leips-analyzer` DBのProjectを`Default Catalog`へ初回migrationできるhelperを追加した。
- Project storeに`activeCatalog`とCatalog作成、切替、rename、削除、一覧、import/export APIを追加した。
- Project保存/読込/Recentはactive CatalogのProject DBだけを見るようにした。
- 未保存Projectの`saveCurrentProject`は`needs-name`を返せるようにした。
- Catalog archiveを`.upsleips-catalog.json.gz`相当のgzip JSONとしてexport/importできるようにした。

## TODO

- TopBar/menu/modalからCatalog操作を呼び出すUIを追加する。
- `Save Project`で`needs-name`が返った場合にSave as modalへフォールバックする。
- Catalog import/export用file inputとtoastを接続する。

## Simplifications / Debt

- Catalog archiveはDexie table rowsをJSON化して`fflate`でgzip圧縮する。`dexie-import-export`は使わない。
- Catalog importは常に新規Catalog IDを発行し、同名はsuffixで回避する。
- Legacy migrationはDefault Catalog DBが空のときだけ実行する。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
