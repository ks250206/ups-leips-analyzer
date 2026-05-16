# Iteration 126: Help title removal

## 目的

Help window内の重複した見出し `UPS-LEIPS Analyzer ヘルプ` / `UPS-LEIPS Analyzer Help` を削除し、window titleとtab UIだけで意味が伝わる表示にする。

## 実装内容

- `HelpWindow` の本文上部にあったタイトルカードを削除した。
- タブ、tab panel title、本文、i18n help contentは維持した。
- 未使用になった `helpTitle` helperを削除した。

## TODO

- なし。

## 完了範囲

- Help windowの余分なタイトル文字列は表示されない。

## 簡易実装 / 技術負債

- なし。表示整理のみ。

## 実行したテスト

- `vp check --fix`
- `vp test --coverage`
- `vp build`
