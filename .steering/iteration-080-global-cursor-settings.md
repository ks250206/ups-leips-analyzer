# Iteration 080: Global Cursor Settings and REELS BG Single Point

## Purpose

Cursor styleを全plot共通設定にし、defaultをpoint cursorに変更する。UPS IPとLEIPS Evacの指定cursor色をorange系へ寄せ、REELS BG専用のsingle point horizontal modeを追加する。

## Implemented

- `useSettingsStore`を追加し、`cursorStyle`を`point` defaultで管理するようにした。
- TopBarと背景context menuに`Setting > Cursor style`を追加した。
- Plot context menuからも同じcursor styleを変更できるようにした。
- `point` / `range` / `Point cursor + REELS BG single point`を全plot共通設定として切り替えられるようにした。
- REELS BG single point modeでは`reels-bg`だけ単点cursorを表示し、その点のy値で水平点線を描くようにした。
- UPS IPのcut-off edge cursorとLEIPS vs Energy from Evac.のedge cursorをorange系に変更した。

## Tests

- Setting menuにcursor style項目が表示され、REELS BG single point cursorへ切り替えられることをcomponent testに追加した。
- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`

## TODO

- REELS BG single point modeの計算自体は既存linear fitを維持している。必要なら次iterationでREELS BG fit計算を水平線モデルへ分岐する。

## Simplifications / Debt

- Cursor styleはUI stateとして扱い、Project JSONには保存していない。
- REELS BG single point cursorは既存fit range幅を保ったまま中心点を移動する。
