# Iteration 084: Analysis Form and Viewport Persistence

## Purpose

- 解析フォームの重複・表記揺れを整理する。
- UPS/LEIPS系plotの拡大範囲をProject stateへ保存し、Project save/load/import/exportで復元できるようにする。

## Implementation

- UPS spectra analysisのVB setから`EF-EVBM`表示を外し、`EVBM`のみ表示する形にした。
- LEIPS Filter context menuの固定候補から`Band pass` prefixを削除し、エネルギー候補だけを表示する形にした。
- LEIPS Bandpass Filter、REELS Incident E/Eg、Band EVB_Mのフォームをlabel/value/unitの3列に揃えた。
- empty projectの`efMinusEvbm`初期値を`0.56`から`0`へ戻した。
- `ProjectSnapshot.ui`にUPS VB、UPS IP、LEIPS raw、LEIPS Evac plot viewportを追加し、各plotの`onViewportChange`で保存するようにした。
- 既存のfit range stateはそのままProject JSON/import/exportに含まれるため、cursor位置復元の仕組みとして維持した。

## TODO

- Save as/Load Project modalでviewport復元を手動確認する。
- plot viewport stateが増えたため、後続でProject JSON migrationの明示テストを厚くする。

## Temporary / Debt

- UPS IPのlocal snapshot view（VBM/Cut-off recall）は従来どおりcomponent local stateで、Project永続化対象にはしていない。

## Tests

- Passed: `vp check`
- Passed: `vp test --coverage`
- Passed: `vp build`
- Passed: `pnpm binary:build`
- Passed: `curl -I http://127.0.0.1:4187/`
- Passed: `curl -I http://127.0.0.1:4187/assets/...`
- Browser smoke: Chromeで空ProjectのBand tabを確認し、EVB_M表示と初期値`0`を確認した。
