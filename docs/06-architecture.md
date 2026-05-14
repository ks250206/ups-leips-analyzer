# Architecture

## Layers

- `src/domain`: スペクトル型、線形fit、ガウスfit、UPS/LEIPS/バンド図計算。
- `src/io`: MultiPak CSV parserとdataset kind推定。
- `src/store`: Zustand store、Dexie database、Project JSON import/export。
- `src/ui`: Workspace window、Data Browser、Table、uPlot wrapper、解析パネル。

## State

Zustandは現在のProject snapshotを保持する。Dexieは保存済みProjectを保持する。Project JSONは同じsnapshot構造を使う。

## Build

`vp build` が静的assetsを `dist/` に生成し、Goの `main.go` が `dist/` を埋め込んで配信する。
