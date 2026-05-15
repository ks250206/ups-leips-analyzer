# Iteration 069: Caddy Cloud Run Container

## Purpose

ローカル/Cloud Run向けコンテナはGo単一バイナリ配信ではなく、CaddyでVite build成果物を静的配信する構成に変更する。

## Implemented

- `Dockerfile`からGo build/runtime stageを削除し、Caddy runtimeへ変更した。
- `Caddyfile`を追加し、Cloud Runの`$PORT`に対応しつつSPA fallbackを行うようにした。
- `compose.yaml`はcontainer内`8080`をhost`127.0.0.1:4173`へ公開する構成に変更した。
- READMEとrelease docsにCaddy/Cloud Run向けコンテナであることを追記した。

## Tests

- `vp check`
- `vp test --coverage`
- `vp build`
- `podman compose build`
- `podman compose up -d`
- `curl -I http://127.0.0.1:4173/`
- `curl -I http://127.0.0.1:4173/favicon.ico`
- `podman compose down`

## TODO

- Cloud Runへの実deploy smokeは未実施。

## Simplifications / Debt

- Caddyfileは最小構成。必要ならsecurity headerやcache headerを後続で追加する。
