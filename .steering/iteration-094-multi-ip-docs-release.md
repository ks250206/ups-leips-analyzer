# Iteration 094: Multi UPS-IP docs and release gate

## 目的

- 複数UPS IP、印加電圧推定、Bias Dependence、Band IP sourceをSSoTに反映する。
- 最終ゲートとGo binary smokeで配布経路を確認する。

## 実装内容

- `docs/02-igor-macro-parity.md`に複数IPと印加電圧依存性を追記。
- `docs/03-data-formats.md`にUPS IP applied bias推定ルールを追記。
- `docs/04-analysis-algorithms.md`にBias dependenceとBand IP sourceを追記。
- `docs/05-ui-workflows.md`にData multi-select、UPS IP tab、UPS Bias Dependence、Band IP sourceを追記。
- `docs/06-architecture.md`に複数IP stateとmigration責務を追記。

## TODO

- 実測CSVで複数IPのvoltage推定精度を確認し、列別metadataが必要な場合は次iterationで追加する。

## 簡易実装 / 技術負債

- MultiPak CSVの列別role推定は今回も未対応。Data BrowserのChange roleで補正する。

## 実行したテスト

- `vp check --fix`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- Go binary smoke
