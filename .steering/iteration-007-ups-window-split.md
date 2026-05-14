# Iteration 007 - UPS window split

## Purpose

- Igor Proに近い作業単位にするため、UPS VBとUPS IPを別ウィンドウへ分割する。
- どちらのUPSグラフもX軸を左が大、右が小の向きにする。

## Implemented

- `WindowLayout.kind`に`ups-vb`と`ups-ip`を追加。
- デフォルトワークスペースに`UPS VB`と`UPS IP`の2ウィンドウを配置。
- `UPSVBPlotWindow`と`UPSIPPlotWindow`を分離し、それぞれ必要なデータ、fit線、マーカー、範囲だけを表示。
- `SpectrumPlot`に`xDirection="reverse"`を追加し、uPlot scale `dir: -1`でX軸を反転。
- アプリsmoke testにUPS VB/IPウィンドウ表示確認を追加。

## TODO

- 次イテレーションで範囲バンド端点をIgor風カーソルとしてドラッグ可能にする。
- LEIPSの真空準位基準プロットを独立ウィンドウ化する。

## Simplifications / Debt

- 旧`ups` window kindは保存済みプロジェクト互換として`UPS IP`表示へフォールバックする。
- 既存IndexedDBに保存済みのレイアウトを自動マイグレーションして新ウィンドウを足す処理はまだない。

## Verification

- Passed: `vp check --fix`
- Passed: `vp test --coverage` (27 tests, all-file line coverage 97.95%)
