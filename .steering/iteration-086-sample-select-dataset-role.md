# Iteration 086: Sample Select and Dataset Role Management

## 目的

- Sample Info tabの表示と入力UIを整理する。
- Data Browserからロード済みdatasetの削除と解析role変更を可能にする。

## 実装内容

- Analysis tab labelを`Sample Info`から`Sample`へ短縮した。
- `含有元素`を`組成(仕込)`の直下へ移動し、組成からの自動抽出結果を近接表示するようにした。
- native `<select>`を使わない`SelectField`/`MultiSelectField`を追加した。
- `電池のイオン種`をmulti-select化し、Project JSONでは配列として保存するようにした。
- 旧Project JSONのstring型multi-select値を配列へ正規化するmigrationを追加した。
- Data Browserのdataset行context menuと行メニューボタンに`Change role`/`Delete dataset`を追加した。
- `deleteDataset`と`setDatasetKind` store actionを追加し、削除・role変更後にanalysis selectionとfit rangeを再計算するようにした。
- dataset role変更時のX軸label補正をstore modelへ追加した。
- `docs/05-ui-workflows.md`と`docs/06-architecture.md`を更新した。

## TODO

- Data Browserのrole変更UIはcontext menu中心。将来、一覧上で直接編集できるcompact controlにしてもよい。
- multi-select対象は現時点で`電池のイオン種`のみ。Excel語彙の運用が固まれば追加する。

## 完了範囲

- Sample tab label、含有元素の配置、custom select、multi-select、dataset削除、dataset role変更まで完了。
- Project save/load/import/exportに乗るstate migrationまで完了。

## 簡易実装・技術負債

- dataset削除確認modalはData Browser内の軽量実装。共通modal化は未実施。
- role変更はdataset `kind`の変更として扱い、元CSV metadataは保持する。

## 実行したテスト

- `vp check`
- `vp test --coverage`
