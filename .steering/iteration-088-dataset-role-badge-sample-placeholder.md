# Iteration 088: Dataset Role Badge and Sample Placeholder

## Purpose

Sample formのplaceholderとData Browserのdataset role管理を、実運用の手動割当フローに合わせて調整する。

## Implemented

- `sample state`のplaceholderを`initial, 1st charge, Ar etched`へ変更した。
- Sample Infoのtext/date入力に`autocomplete="off"`と固有`name`を付け、ブラウザの住所系autofillが出にくいようにした。
- Data Browserの`Change role`はdataset `kind`とX軸labelだけを変更し、Analysisの解析対象slotへ自動割当しない仕様へ変更した。
- 既存の解析対象slotに入っていたdatasetのkindが変わった場合、そのslotは解除する。
- Data Browser上で、Analysis Data tabに割り当て済みのdatasetだけをUPS/LEIPS/REELSなどの色付きbadgeで表示するようにした。未割当datasetは灰色badgeで現在のkindだけを表示する。
- `UPS_analysis` windowの初期高さをREELS Plot下端に揃えるため、初期heightを`1062`へ拡張した。

## TODO

- Data Browser上で、解析slotへ直接割り当てるショートカット操作を追加するかは後続判断。
- ブラウザautofillは実装依存があるため、必要なら`autocomplete` tokenをさらに細かく調整する。

## Simplifications / Debt

- 色付きbadgeはTailwind classの静的mapで実装した。将来的にSpectrum kind色定義をplot色定義と共通化してもよい。
- role変更時のfit rangeは既存のselectionを維持できるものだけで再初期化する。新しいkind用slotへの自動fit range初期化は、手動割当時に行う。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- Go binary smoke: `/` and built `/assets/...`
