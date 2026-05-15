# Iteration 068: Release and Dev Environment

## Purpose

favicon、icon付き配布物、Nix dev shell、GitHub Actions release build、Docker実行環境を整備する。

## Implemented

- `sample/favicon.ico`を`public/favicon.ico`へ配置し、Web favicon参照を`.ico`へ変更した。
- Windows build scriptをfavicon icon resource埋め込み対応にした。
- macOS `.app` bundle生成scriptを追加し、`favicon.icns`、`Info.plist`、zip assetを生成するようにした。
- `darwin-amd64` raw binary buildとmacOS app build scriptsを追加した。
- `flake.nix`/`flake.lock`を追加し、Nix dev shellでNode/Corepack/Go/Gitを使えるようにした。
- Release workflowを追加し、macOS arm64/amd64 `.app.zip`とWindows amd64 `.exe`を生成・添付するようにした。
- `Dockerfile`、`.dockerignore`、`compose.yaml`を追加した。
- READMEとrelease docsへ新しい配布/開発コマンドを追記した。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `pnpm binary:build`
- `pnpm binary:build:darwin-arm64`
- `pnpm binary:build:darwin-amd64`
- `pnpm binary:build:windows-x64`
- `pnpm binary:build:macos-app:arm64`
- `pnpm binary:build:macos-app:amd64`
- `file`でmacOS arm64/amd64、Windows amd64 artifactを確認
- `.app/Contents/Resources/favicon.icns`と`CFBundleIconFile`を確認
- `objdump -x`でWindows `.rsrc` sectionを確認
- `nix flake check --no-build`
- `nix develop -c sh -c 'node --version && pnpm --version && go version'`
- `curl -I http://127.0.0.1:4187/`
- `curl -I http://127.0.0.1:4187/assets/index-*.css`
- `docker-compose config`

## TODO

- Docker daemonが起動していないため、`docker compose build`/`docker-compose build`は実行できなかった。daemon起動後に再確認する。
- GitHub Actionsのrelease asset uploadは実際のGitHub `workflow_dispatch`またはrelease publishで確認する。

## Simplifications / Debt

- Windows icon resourceはbuild時に一時`resource_windows_amd64.syso`を生成し、build後に削除する方式にした。
- macOS `.app`は署名/Notarizationなし。必要なら後続でDeveloper ID signingを追加する。
