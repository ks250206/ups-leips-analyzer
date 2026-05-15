# Iteration 075: REELS UI Vertical Slice

## Purpose

REELS解析結果をワークスペース上で確認・操作できる最小UIを追加する。

## Implemented

- `REELS Plot` windowを追加し、raw kinetic datasetをloss axisへ変換して表示するようにした。
- REELS onset edge/BGのfit線、cursor range、Eg markerを既存D3 `SpectrumPlot`上に表示するようにした。
- `UPS_analysis`にREELS tabを追加し、incident energyとEgを表示・編集できるようにした。
- Window title、right-click dataset submenu、Windows menu、active tab switchingにREELS windowを接続した。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`

## TODO

- Docs同期とGo binary smokeはIteration 076で実施する。

## Simplifications / Debt

- REELS plotはloss energy軸のみ表示する。Kinetic Energy表示切替は後続対応。
