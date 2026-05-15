# Iteration 093: UPS bias dependence and Band IP source

## 目的

- 帯電影響確認用にEcutoff、EVBM、IPの印加電圧依存性を表示する。
- Band Diagramで使うIP値を、0 V外挿、特定dataset、平均から選択できるようにする。

## 実装内容

- `UPS Bias Dependence` windowを追加し、Cutoff/EVBM/IPをApplied Biasに対して表示するようにした。
- 2点以上の有効なIP datasetがある場合は線形fitと0 V値を表示する。
- Band tabにIP source selectorを追加した。
- Band Diagram計算は`bandIpSource`を通じてIP値を解決するようにした。

## TODO

- Igorのscatter markerに近づけるため、D3 plotの点描画表現を強化する。
- Band DiagramのIP source説明と不足データ時のUI表示をより明確にする。

## 簡易実装 / 技術負債

- Bias dependence plotのdataset点は現状seriesとして描画している。点marker専用描画は後続で改善する。

## 実行したテスト

- `vp check --fix`
- `vp test --coverage`
- `vp build`
