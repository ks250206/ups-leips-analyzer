# Iteration 099: Analysis compact tabs and aligned gap

## Purpose

- Analysis tab buttonの`Sample`表示が狭いwindowであふれる問題を直す。
- UPS_analysis windowをさらに縮小しつつ、右側だけgapが広くならないように横gapを揃える。

## Implemented

- Analysis tab labelを`Sample`から`Samp.`へ変更した。
- Analysis tab barのfont sizeを一段小さくし、button horizontal paddingを少し減らした。
- UPS_analysis default widthを`378 -> 357`へ変更した。
- UPS_analysis default xを`1502 -> 1448`へ変更し、UPS IP / LEIPS Evac columnとの横gapを他のplot間gapに合わせた。
- 既存Projectで旧Analysis widthが保存されている場合、normalize時に新しいx/widthへ移行するようにした。

## Tests

- Updated App tests for `Samp.` tab label.
- Updated store normalization expectations for the new Analysis width and x.
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

- If additional tabs are added, consider moving Analysis navigation to a compact segmented menu or overflow menu.
