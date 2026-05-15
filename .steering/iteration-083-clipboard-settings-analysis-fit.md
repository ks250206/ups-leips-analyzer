# Iteration 083: Clipboard PNG, Settings Persistence, Analysis Fit Polish

## Purpose

plot画像をPNGとしてclipboardへコピーできるようにし、Settingのcursor styleをlocalStorageへ保存する。Analysis Fit tabはbutton群を外し、range入力行そのものを選択対象にする。

## Implemented

- plot context menuに`Copy PNG`を追加した。
- SVGをPNG Blobへ変換するhelperを共通化し、PNG downloadとclipboard copyで使うようにした。
- Band Diagram context menuにも`Copy PNG`を追加した。
- Band DiagramのCBM点線の開始位置を、EA矢印より少し上になる程度へ戻した。
- `cursorStyle`を`localStorage`へ保存し、起動時に復元するようにした。
- Analysis tabのactive色をslate系へ変更した。
- Fit tabの上段target buttonを削除し、range editor行をfocus/pointer downでactive targetへするようにした。
- Fit range入力は小数第3位表示にし、`-`や空文字など未完成の数値入力を許容するようにした。

## Tests

- Setting menuから`Range cursor`を選ぶとlocalStorageへ保存されるcomponent testを追加した。
- plot context menuに`Copy PNG`が表示されることをcomponent testで確認した。

## TODO

- Clipboard API非対応ブラウザでは現在no-op。必要ならtoastで未対応を通知する。
- Fit range入力の編集中表示はlocal component stateで管理している。将来、より複雑なvalidation messageが必要になったら専用input componentへ分離する。

## Simplifications / Debt

- Clipboard copyの成功/失敗toastは今回未実装。
