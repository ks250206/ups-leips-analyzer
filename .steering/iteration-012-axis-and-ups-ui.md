# Iteration 012 - axis and UPS UI

## Purpose

- LEIPS系グラフのX軸を左が大、右が小にする。
- Band DiagramはEnergy relative to Ef/eVとして左が小、右が大を明示する。
- UPS IPウィンドウでIP setのEVBMとEcut-offを同じdataset上で選べるようにする。

## Implemented

- UPS IPウィンドウへ`IP VBM edge/BG`のfit線、marker、A/B/C/Dカーソルを追加。
- Ecut-off側はE/F/G/Hカーソルとして残した。
- Analysis ControlsのUPSタブを`VB set`と`IP set`に分けた。
- Fit targetラベルをVB set/IP EVBM/Ecut-offの意味に合わせて更新。
- LEIPS rawとLEIPS Evacへ`xDirection="reverse"`を設定。
- Band Diagramへ`xDirection="normal"`を明示。

## TODO

- 次イテレーションでfit線をカーソル範囲外へ外挿表示する。

## Simplifications / Debt

- Fit targetボタンは全カテゴリを1つのFitタブに並べている。後続でUPS/LEIPS別のグループ表示にすると操作性が上がる。

## Verification

- Passed: `vp check`
- Passed: `vp test --coverage` (27 tests, all-file line coverage 97.99%)
