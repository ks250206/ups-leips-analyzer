# Iteration 090: Catalog UI and Import Export

## Purpose

Catalog基盤をTopBar/menu/modalへ接続し、Catalog単位の切替とimport/exportを操作できるようにする。

## Implemented

- TopBar menuを`Catalogs / Projects / View / Windows / Help`へ変更した。
- TopBar badgeにactive Catalog名とcurrent Project名を両方表示するようにした。
- `Catalogs` menuにNew/Switch/Rename/Export/Import/Deleteを追加した。
- Catalog name modal、Switch Catalog modal、Delete Catalog modalを追加した。
- Catalog import/export用file inputとdownloadをWorkspaceへ接続した。
- `Projects > Save Project`は未保存New Projectでは`Save as ...` modalを開くようにした。
- Project ListとRecent projectはactive Catalog内だけを参照する。
- Help textとUI workflow docsをCatalogs/Projects分離後の文言へ更新した。

## TODO

- Catalog listをProject Listと同じvirtual tableへ寄せるかは後続判断。
- Catalog export/importの実ブラウザdownload/upload smokeを追加する余地がある。

## Simplifications / Debt

- Switch Catalog modalは自前の軽量listで実装した。Catalog数が増えた場合はvirtual table化する。
- Catalog importは成功後にimportされたCatalogへ自動切替する。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- Go binary smoke: `/` and built `/assets/...`
