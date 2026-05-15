# Iteration 051: Menu and Load Project Polish

## Purpose

Context menuのRecent submenu、アプリタイトル、Data Browser文言、Load Project導線、Band Diagram controlの見切れを直す。

## Implemented

- Browser titleを`app-scaffold`から`ups-leips-analyzer`へ変更。
- ContextMenuのsubmenu表示をCSS `group-hover`からReact hover stateへ変更し、Recent project submenuが常時開かないようにした。
- Project menuと背景context menuに`Load Project`を追加し、Project一覧をmodal内で表示できるようにした。
- Data BrowserのCSV入力を`Load CSVs`へ変更し、英語でdropdown file fieldであることを明記した。
- Band Diagram default window sizeを大きくし、下部controlをwrap可能なflex layoutへ変更して見切れを減らした。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- `curl -I http://127.0.0.1:4199/`
- `curl -I http://127.0.0.1:4199/assets/index-*.js`
- Browser smoke: `Load CSVs`文言、Recent project submenuが非hover時に展開されないこと、Load Project modalを確認。

## TODO

- 実データ表示状態でBand Diagram controlの折り返しと見切れを継続確認する。

## Simplifications / Debt

- Load Project modalはProject tableのdouble click loadを使う。明示的なLoad button付き選択UIは後続。
