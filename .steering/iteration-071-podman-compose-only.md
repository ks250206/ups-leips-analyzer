# Iteration 071: Podman Compose Only

## Purpose

Nix dev shellとドキュメントをPodman Compose前提へ統一し、Docker Compose依存を外す。

## Implemented

- `flake.nix`から`docker-compose`を削除した。
- READMEのコンテナ起動例を`podman compose build/up`に変更した。
- release docsのmanual smokeを`podman compose up`へ統一した。
- 直前iteration logのNix検証コマンド表記を`podman-compose`へ修正した。
- `PODMAN_COMPOSE_PROVIDER=podman-compose`をdev shellで設定し、Docker Compose providerを使わないようにした。

## Tests

- `vp check`
- `nix flake check --no-build`
- `nix develop -c sh -c 'node --version && pnpm --version && go version && podman --version && podman-compose --version'`
- `nix develop -c sh -c 'podman compose config'`

## TODO

- なし。

## Simplifications / Debt

- `podman compose`が外部providerを使う環境差はPodman側に委ねる。dev shellには`podman-compose`を含める。
