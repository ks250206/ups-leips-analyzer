# Iteration 120: macOS app launch fix

## Purpose

macOSのアイコン付き `.app` がDockで跳ね続け、ブラウザもTerminalも開かない見え方になる問題を修正する。

## Implemented

- Go binary起動時にmacOSでは既定ブラウザを自動で開くようにした。
- `--no-open` flagを追加し、CIや手動検証ではブラウザ自動起動を抑制できるようにした。
- デフォルトportが使用中の場合、明示指定でなければ次の空きportへfallbackするようにした。
- macOS app bundleの `Info.plist` に `LSUIElement=true` を追加した。
- `.app` bundle全体をad-hoc署名し、zip作成時に `._*` AppleDouble fileが入らないようにした。
- READMEとrelease docsにmacOS `.app` の起動仕様、Gatekeeper注意、終了方法を追記した。

## TODO

- Dock常駐アイコンや終了メニューが必要な場合は、後続でmenu bar helperまたはSwift wrapperを検討する。

## Simplifications / technical debt

- 正式なDeveloper ID署名とnotarizationは今回の範囲外。ad-hoc署名でbundle整合性を整える。
- `.app` はネイティブGUIではなく、ローカルHTTPサーバー + ブラウザ操作の配布形態を維持する。

## Tests

- `go test ./...`
- `vp check`
- `vp test --coverage`（初回は既存App menu testが1件失敗、直後の再実行で123 tests passed）
- `vp build`
- `pnpm binary:build:macos-app:arm64`
- `plutil -p bin/UPS-LEIPS\ Analyzer-darwin-arm64.app/Contents/Info.plist` で `LSUIElement=true` を確認
- `codesign -dv --verbose=4 bin/UPS-LEIPS\ Analyzer-darwin-arm64.app` でadhoc署名とsealed resourcesを確認
- `zipinfo -1 bin/UPS-LEIPS-Analyzer-darwin-arm64.app.zip | rg '(^|/)\\._' || true` でAppleDouble fileなしを確認
- `open bin/UPS-LEIPS\ Analyzer-darwin-arm64.app` 後、`curl -I http://127.0.0.1:4173/` が `200 OK`
