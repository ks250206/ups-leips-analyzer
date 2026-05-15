# Iteration 055: Plot Menu, Dataset Title, and Bandpass Polish

## Purpose

plot context menuの順序、plot windowごとのdataset切替、custom bandpass、背景クリック時のactive表示解除、Band Diagram初期配置を整える。

## Implemented

- SpectrumPlotのcontext menuを、plot固有項目を先、`Reset view` / `Export PNG` / `Export SVG`を末尾にする順序へ変更した。
- LEIPS Plotの`Filter` submenuにcustom bandpass modeを追加し、Analysis ControlsのLEIPS tabで任意bandpass energyを入力できるようにした。
- `AnalysisState.customBandpassEnergy`と`setCustomBandpassEnergy`を追加し、LEIPS計算とEvac推定にcustom値を渡すようにした。
- UPS VB、UPS IP、LEIPS Plot、LEIPS vs Energy from Evac.のwindow titleに現在割当中の主dataset名を表示するようにした。
- plot windowのtitlebar/context menuから、Analysis Controls Data tabと同じdataset割当を変更できるようにした。
- 背景クリックでwindowのactive highlightだけを解除するようにした。z-indexの重ね順は維持する。
- 空Project時のBand Diagram default windowをUPS VB/LEIPS Plotと同じX位置に寄せ、幅を通常plot windowに合わせた。
- SSoTとして`docs/04-analysis-algorithms.md`と`docs/05-ui-workflows.md`を更新した。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- `curl -I http://127.0.0.1:4199/`
- `curl -I http://127.0.0.1:4199/assets/index-CDY0w_JD.css`
- Browser smoke: `http://127.0.0.1:5173/`でapp title、`Load CSVs`、Band Diagram、No data placeholder表示を確認

## TODO

- 実ブラウザでtitlebar右クリックdataset切替、custom bandpass入力、背景クリックactive解除を確認する。

## Simplifications / Debt

- LEIPS Plotのcontext menuはcustom modeの有効化までとし、任意値の数値入力はAnalysis Controls側に置く。
- Band Diagramのdefault layout変更は新規/リセットProjectに反映される。既存Projectに保存済みのwindow配置はそのまま尊重する。
