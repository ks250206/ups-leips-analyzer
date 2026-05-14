# Iteration 022: Independent Fit Errors and Hover Focus

## Purpose

LEIPS vs Energy from Evac. のBG fit範囲が不適切なときに、全解析結果と操作が巻き添えで止まる問題を直す。ウィンドウ内のボタンやドラッグは、事前クリックなしで初回操作から効くようにする。

## Implemented

- `recalculateProject`のUPS/LEIPS/Band計算を個別`try`へ分離。
- LEIPS fitだけ失敗した場合は`LEIPS: ...`を`analysis.error`へ出し、UPS結果は保持する。
- LEIPSが失敗した状態ではBand Diagramだけ無効化し、他の計算結果を巻き込まない。
- `WindowFrame`に`onMouseEnter={onFocus}`を追加し、クリック前のhover時点でwindow focus/z-indexを更新する。
- LEIPS BG範囲が無効でもUPS結果が残るstore testを追加。

## TODO

- Browser上で、非focus window内のボタン初回クリックとwindow dragの体感確認を継続する。

## Scope

- 今回はfit失敗の分離と初回操作focusに限定。
- LEIPS BG範囲の自動推定やデータ別default range調整は後続iterationで扱う。

## Tests

- Passed: `vp check`
- Passed: `vp test --coverage`
- Passed: `vp build`
- Passed: `pnpm binary:build`
