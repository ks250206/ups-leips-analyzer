# Iteration 072: Tag Push Release Workflow

## Purpose

GitHub Release workflowをタグpushで起動し、release asset生成まで行えるようにする。

## Implemented

- `.github/workflows/release.yml`に`push.tags: v*` triggerを追加した。
- `softprops/action-gh-release`を`release.published`だけでなく、tag refでも実行するようにした。
- `workflow_dispatch`はartifact確認用として維持した。

## Tests

- `vp check`

## TODO

- 実際のtag pushによるGitHub Actions実行確認は未実施。

## Simplifications / Debt

- tag patternは`v*`のみ。`0.1.0`のような非vタグは対象外。
