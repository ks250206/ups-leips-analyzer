# Iteration 093: i18n Local Settings

## Purpose

表示言語をProject/Catalogに含めないユーザー個人設定として扱い、Sample Infoの表示を`ja-JP`/`en-US`で切り替えられるようにする。

## Implemented

- `src/ui/Settings.ts`へ`useUserSettingsStore`を追加し、localeを`localStorage`へ保存するようにした。
- default localeは`ja-JP`。対応localeは`ja-JP`と`en-US`。
- TopBar/background共通menuに`Setting > Language`を追加した。
- `en-US`選択時はSample Infoのfield labelとplaceholder、含有元素labelを英語表示にする。
- localeはProject/Catalog stateに入れず、Project JSON/Catalog archiveには含めない方針をdocsに追記した。
- UI testでlocalStorage保存、英語label切替、Project stateにlocaleが混ざらないことを確認した。

## TODO

- Sample Info以外のUI文言の翻訳は後続で扱う。
- 日付/数値書式のlocale対応は後続で扱う。

## Simplifications / Debt

- i18n辞書はSample Info専用の静的mapとして実装した。全UI向けの翻訳基盤にはまだ拡張していない。
- select optionの語彙自体は現行の値を維持し、label/placeholderのみ切り替える。

## Tests

- `vp check --fix`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- Go binary smoke: `/` and built `/assets/...`
