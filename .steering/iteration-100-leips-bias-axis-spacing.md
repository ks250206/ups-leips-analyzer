# Iteration 100: LEIPS and bias axis spacing

## Purpose

- LEIPS PlotとUPS Bias DependenceのX軸ラベルで`Vbias`の`bias`を下付き表示する。
- LEIPS vs Energy from Evac.のX軸ラベルがwindow下端で見切れる問題を直す。
- LEIPS系windowの縦幅を少し増やし、plot labelの余白を確保する。
- UPS Bias Dependenceの上下余白を詰める。

## Implemented

- SVG axis label rendererに`Applied Bias Vbias / V`用の下付き表示を追加した。
- UPS Bias DependenceのX labelを`Applied Bias Vbias / V`へ変更した。
- 通常plot marginを`top: 16`、`bottom: 36`へ調整し、Bias Dependenceの上下余白を減らした。
- LEIPS plot marginは`bottom: 54`にして、subscript付きX labelの見切れを避けた。
- LEIPS Plot / LEIPS vs Energy from Evac.のdefault heightを`350 -> 370`へ変更した。
- Band Diagram / REELSのdefault yを`1090 -> 1110`へ下げ、LEIPS window増高分のgapを維持した。
- 既存Projectの旧LEIPS高さ、Band/REELS位置もnormalizeで新配置へ移行するようにした。

## Tests

- Updated SpectrumPlot geometry tests for new normal/LEIPS margins.
- Added store normalization coverage for legacy LEIPS heights and lower-row positions.
- Ran `vp check --fix`.
- Ran `vp test --coverage`.
- Ran `vp build`.
- Ran `pnpm binary:build`.
- Ran Go binary smoke for `/` and `/assets/...`.

## Coverage

- Statements: 95.53%
- Branches: 80.44%
- Functions: 97.90%
- Lines: 95.44%

## TODO / Debt

- Axis label subscript rendering remains string-match based. Extract a tokenized label renderer if more formatted axis labels are added.
