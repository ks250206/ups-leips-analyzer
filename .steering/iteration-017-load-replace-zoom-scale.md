# Iteration 017 - load replace, zoom, raw scaling

## Purpose

- CSV読み込み時にdemo datasetを消し、読み込みdatasetだけへ切り替える。
- UPS/LEIPS Evacなどでfit線がY軸スケールを広げないよう、生スペクトルだけで軸スケールを決める。
- plot上の通常ドラッグでX範囲拡大できるようにする。
- LEIPS raw plotは負値軸として左が小、右が大になるようnormal方向へ戻す。

## Implemented

- `addDatasets`時に既存demo fixtureを除外してから読み込みdatasetをmerge。
- 読み込みdatasetを同じkindの解析slotへ自動割当。
- `PlotSeries.affectsScale`を追加し、線形fit/ガウスfitは`affectsScale: false`にした。
- uPlot series optionへ`auto`を渡し、fit seriesを自動Y scale計算から外した。
- uPlot drag zoomを有効化し、通常ドラッグでX軸zoom、Resetボタンで全X範囲に戻せるようにした。
- Shift+ドラッグのみ従来のfit範囲選択へ使う。
- LEIPS raw plotの`xDirection`を`normal`へ変更。

## TODO

- zoom状態をProjectに保存するかは未定。
- SVG exportはzoom状態、右Y軸、反転軸に未対応。

## Verification

- Passed: `vp check --fix`
- Passed: `vp test --coverage` (37 tests, all-file line coverage 97.70%)
- Passed: `vp build`
- Passed: `pnpm binary:build`
- Passed: `curl -I http://127.0.0.1:4187/`
- Passed: `curl -I http://127.0.0.1:4187/assets/index-Bcvtmtje.js`
