# Iteration 096: Bias layout and titlebar IP selection

## Purpose

- UPS Bias DependenceをCutoff / EVBM / IPの3つの独立plotとして同一window内に横並び表示する。
- UPS IPのactive dataset selectorをTopBarからUPS IP window titlebarへ移動する。
- Analysis controlsの下部Calculate buttonを削除し、Band IP source selectorをcustom selectへ置換する。

## Implemented

- `UPS Bias Dependence` windowは3列gridになり、各plotを独立した`SpectrumPlot`として描画する。
- 各Bias plotは4:3 ratio、scatter marker、linear fit line、`y = ax + b eV` annotationを持つ。
- Bias plotのviewport stateを`project.ui.upsBiasPlotViewports`にplot別保存するようにした。
- 既存projectの旧`UPS Bias Dependence` window幅はnormalize時に2-grid幅へmigrationする。
- TopBarのUPS IP multi-selectを削除した。
- UPS IP window titlebarにactive IP dataset用のsingle custom selectを追加した。
- last opened workspace restoreのtoastがReact StrictMode等で二重に出ないよう、restore開始をrefでguardした。
- Analysis controls下部の`Calculate` buttonを削除した。
- Analysis Band tabのIP source selectorをnative selectからcustom `SelectField`へ変更した。
- `SelectField`はcustom labelとdisabled optionを扱えるようにした。

## Tests

- Added store coverage for `upsBiasPlotViewports`.
- Added normalize coverage for legacy UPS Bias window width migration.
- Ran `vp check --fix`.
- Ran `vp test --coverage`.
- Ran `vp build`.
- Ran `pnpm binary:build`.
- Ran Go binary smoke for `/` and `/assets/...`.

## Coverage

- Statements: 95.48%
- Branches: 80.27%
- Functions: 97.88%
- Lines: 95.40%

## TODO / Debt

- UPS IP titlebar selector is compact and functional, but long dataset names may still need a dedicated tooltip or wider titlebar affordance later.
