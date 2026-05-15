# Iteration 098: Analysis window width and panel gap

## Purpose

- UPS_analysis windowの横幅を約90%に縮小する。
- 縮小分をplot panel群とのgapに回す。

## Implemented

- Default `UPS_analysis` window widthを`420 -> 378`へ変更した。
- 右端位置を維持するため、default xを`1460 -> 1502`へ変更した。
- 既存Projectで旧幅のAnalysis windowが保存されている場合、normalize時に新しいx/widthへ移行するようにした。

## Tests

- Added store normalization coverage for legacy UPS_analysis width.
- Ran `vp check --fix`.
- Ran `vp test --coverage`.
- Ran `vp build`.
- Ran `pnpm binary:build`.
- Ran Go binary smoke for `/` and `/assets/...`.

## Coverage

- Statements: 95.49%
- Branches: 80.33%
- Functions: 97.89%
- Lines: 95.42%

## TODO / Debt

- Analysisフォーム内の個別field幅は現状維持。狭く感じるpanelが出た場合はtabごとにcompact gridを調整する。
