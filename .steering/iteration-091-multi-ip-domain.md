# Iteration 091: Multi UPS-IP domain/store

## 目的

- UPS IPを複数dataset選択へ拡張し、datasetごとの印加電圧、fit range、plot viewport、解析結果を保持できるようにする。
- Band Diagramで利用するIP値を、特定dataset、全平均、0 V外挿から選べる土台を作る。

## 実装内容

- `UPSIPResult`、`UPSIPFitRanges`、`UPSIPConfig`、`BandIpSource`を追加。
- `AnalysisSelection.upsIpDatasetIds`、`analysis.upsIpFitRangesByDatasetId`、`analysis.upsIpConfigsByDatasetId`を追加し、旧`upsIpDatasetId`からmigrationするようにした。
- CSV parserに`inferAppliedVoltage`を追加し、series/header、metadata、filenameから`IP-5V`等の印加電圧を推定するようにした。
- storeに複数UPS IP選択、dataset別fit range、dataset別viewport、印加電圧編集、Band IP source設定のAPIを追加。
- Demoデータに複数UPS IP datasetを追加した。

## TODO

- UPS IP windowのタブUIとAnalysis UPS tabの表示をさらに詰める。
- Bias dependence plotの散布点表現をIgor表示へ寄せる。
- Band Diagram UIでIP sourceの説明とエラー表示を整える。

## 簡易実装 / 技術負債

- `UPSResult`は互換のため旧トップレベルIP値を残し、先頭IP datasetの値を入れている。
- `Change role`でUPS IPへ変えたdatasetは自動解析対象にしない方針を維持した。

## 実行したテスト

- `vp check --fix`
- `vp test --coverage`
- `vp build`
