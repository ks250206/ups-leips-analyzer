# Data Formats

## MultiPak CSV

v1の正式対象はMultiPakから出力したCSV。

基本形:

```text
area
description
kind
series metadata
file#,2,4,...
x,y1,y2,...
```

- 先頭5行をmetadataとして扱う。
- 3行目を測定種別の第一候補にする。
- 5行目以降を数値行として扱う。
- y列が複数あるCSVは、1つのx列を共有する複数datasetに展開する。
- 行末の空行、非数値行、`0,0` 終端は読み飛ばす。

## Dataset Kinds

- UPS VB: filenameまたはkindに `VB` を含む。
- UPS IP/cut-off: filenameまたはkindに `IP` を含む。
- LEET: filenameまたはkindに `LEET` を含み、`der` を含まない。
- LEET(der): filenameまたはkindに `LEET` と `der` を含む。
- LEIPS: filenameまたはkindに `LEIPS` を含む。

## SPE

`.spe` はバイナリ本体を含むためv1では正式対応しない。CSV出力済みファイルを読み込む。
