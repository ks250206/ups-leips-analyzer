# Iteration 095: Multi-IP polish and safety flows

## Purpose

- UPS IP multi-selectの表示崩れを直し、IP dataset切替をplot上部ボタンからTopBar側のcompact selectorへ移す。
- Bias dependence plotを点 + 線形fit + 近似式annotationで表示する。
- REELS single-point BG modeのEg計算をplot表示とAnalysis結果で一致させる。
- Catalog/Projectの危険操作と復元通知を改善する。

## Implemented

- UPS IP multi-selectは、複数選択時に`first dataset .. + N`の短縮表示にした。
- TopBar右側にUPS IP dataset selectorを追加し、UPS IP plot上部のdatasetボタンを削除した。
- UPS IP plotのviewport request keyをactive dataset単位にし、dataset切替時に表示レンジが共有されないようにした。
- UPS IP plot context menuにactive UPS IP dataset切替を追加した。
- UPS Bias Dependence plotは4:3の描画領域にし、scatter marker、linear fit、`y = ax + b eV` annotationを表示するようにした。
- REELS `single-point y=const` modeではBG範囲中心のスペクトル値を水平線として使い、AnalysisのEgも同じ計算にした。
- 起動時にlast opened workspace復元へ成功した場合、toastを出すようにした。
- Catalog削除でdefault catalogが残るケースでも、catalog DB内の全project rowsをclearするようにした。
- Band Diagram context menuからIP sourceを切り替えられるようにした。
- Catalog削除modalは5秒待機式にし、警告icon、残秒表示、progress fill付きbuttonで有効化するようにした。
- Save asで同名Projectがある場合は、上書き警告modalを出し、Cancel / Rename / Confirmedを選べるようにした。

## Tests

- Added unit coverage for REELS single-point horizontal BG fit and clamp behavior.
- Added unit coverage for clearing projects when deleting the only default catalog.
- Ran `vp check --fix`.
- Ran `vp test --coverage`.
- Ran `vp build`.
- Ran `pnpm binary:build`.
- Ran Go binary smoke:
  - `curl -I http://127.0.0.1:4187/`
  - `curl -I http://127.0.0.1:4187/assets/...`

## Coverage

- Statements: 95.44%
- Branches: 80.24%
- Functions: 97.85%
- Lines: 95.37%

## TODO / Debt

- Save-as duplicate modal is intentionally lightweight and uses the existing Save as input flow for rename.
- UPS IP dataset selector is now available in both Analysis Data tab and TopBar. If the TopBar becomes crowded, move it into a dedicated compact toolbar window.
