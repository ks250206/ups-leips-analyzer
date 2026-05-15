# Iteration 092: Multi UPS-IP UI

## 目的

- Analysis Data tabでUPS IPを複数選択できるようにする。
- UPS IP windowをdatasetタブ化し、各datasetのplot viewportとfit cursorを独立して扱う。

## 実装内容

- Data tabのUPS IPをcustom multi-selectに変更。
- UPS IP windowにdataset tabを追加し、tabごとにスペクトル、fit線、marker、viewportを切り替えるようにした。
- UPS tabにIP dataset別のApplied bias、EVBM、Ecut-off、IP表示を追加した。
- Data BrowserのUPS-IP badgeは複数選択を反映するようにした。

## TODO

- UPS IP tabの表示名を長いファイル名でも扱いやすくする。
- IP dataset tabの並び替えと削除時のactive tab挙動は必要に応じて改善する。

## 簡易実装 / 技術負債

- UPS IP context menuのdataset切替はmulti-select toggleとして動くが、詳細なcheckable menu UIは後続改善余地がある。

## 実行したテスト

- `vp check --fix`
- `vp test --coverage`
- `vp build`
