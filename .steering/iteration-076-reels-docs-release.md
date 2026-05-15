# Iteration 076: REELS Docs and Release Gate

## Purpose

REELS実装をSSoT docsへ反映し、最終release gateを確認する。

## Implemented

- Product requirementsにREELS v1 scopeを追加した。
- Igor macro parityに`change_Ek_to_Eloss_REELS`と`calc_VBM_or_Ecutoff_or_EA(4)`の対応を追記した。
- Data formatsにREELS MultiPak CSV判定とKinetic Energy扱いを追記した。
- Analysis algorithmsに`ElectronLossEnergy = incidentEnergy - kineticEnergy`と`Eg_REELS`を追記した。
- UI workflow、architecture、testing/release docsをREELS対応へ同期した。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- `curl -I http://127.0.0.1:4187/`
- `curl -I http://127.0.0.1:4187/assets/react-vendor-DRTYvtHH.js`

## TODO

- 実データREELS CSVでcursor初期値とfit範囲の実用性を次イテレーションで確認する。

## Simplifications / Debt

- `.pxp`、`.spe`本体parser、Kinetic Energy表示切替は未対応。
