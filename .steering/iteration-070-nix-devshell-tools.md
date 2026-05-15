# Iteration 070: Nix Dev Shell Tools

## Purpose

Nix dev shellでVite+ / pnpm / Podman Composeの作業にすぐ入れるようにする。

## Implemented

- `flake.nix`へ`pnpm`を追加した。
- `podman`、`podman-compose`をdev shellへ追加した。
- `node_modules/.bin`をPATHへ追加し、`pnpm install`後に`vp dev`などのVite+コマンドが直接使えるようにした。
- shellHookの案内を`pnpm install`、`vp dev`、`podman compose build/up`へ更新した。

## Tests

- `vp check`
- `nix flake check --no-build`
- `nix develop -c sh -c 'node --version && pnpm --version && go version && podman --version && podman-compose --version'`
- `nix develop -c sh -c 'test -d node_modules/.bin && command -v vp'`

## TODO

- `podman machine`の作成/起動は開発者環境に依存するため自動化していない。

## Simplifications / Debt

- `vp`自体はnpm devDependencyなので、`pnpm install`前は利用不可。dev shellではPATHだけ準備する。
