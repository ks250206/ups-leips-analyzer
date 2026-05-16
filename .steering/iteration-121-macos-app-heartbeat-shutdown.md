# Iteration 121: macOS app heartbeat shutdown

## Purpose

macOS `.app` でブラウザページを閉じてもローカルサーバーがバックグラウンド常駐し続ける問題を解消する。

## Implemented

- `.app` 起動時だけ `index.html` にheartbeat scriptを注入するようにした。
- `/__ups_leips/heartbeat` endpointを追加し、ブラウザページから3秒間隔でheartbeatを送るようにした。
- heartbeatが一度届いた後、15秒以上途切れた場合はサーバーを自動終了するようにした。
- 初回ページロード前は60秒の猶予を持たせ、ブラウザ起動が遅い場合に即終了しないようにした。
- `--no-open` や非macOS起動ではheartbeat scriptを入れず、従来どおりサーバーを常駐させる。
- READMEとrelease docsのmacOS `.app` 終了仕様を更新した。

## TODO

- 完全なネイティブ終了UIが必要なら、後続でmenu bar helperまたはSwift wrapperを検討する。

## Simplifications / technical debt

- ブラウザタブ単位の厳密なclose eventではなく、heartbeat停止を検知する方式にした。
- 複数タブを開いた場合は、最後のheartbeatが止まった後に終了する。

## Tests

- `go test ./...`
- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build:macos-app:arm64`
- `open bin/UPS-LEIPS\ Analyzer-darwin-arm64.app`
- `curl -fsS http://127.0.0.1:4173/ | rg '__ups_leips/heartbeat'`
- `curl -I http://127.0.0.1:4173/__ups_leips/heartbeat`
- `plutil -p bin/UPS-LEIPS\ Analyzer-darwin-arm64.app/Contents/Info.plist`
- `codesign -dv --verbose=4 bin/UPS-LEIPS\ Analyzer-darwin-arm64.app`
- `zipinfo -1 bin/UPS-LEIPS-Analyzer-darwin-arm64.app.zip | rg '(^|/)\\._' || true`
