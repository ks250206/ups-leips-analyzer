# Analysis Algorithms

## Linear Fit

選択範囲内の点を通常最小二乗で `y = intercept + slope * x` にfitする。

edgeとBGの交点:

```text
x = (edge.intercept - bg.intercept) / (bg.slope - edge.slope)
```

## UPS

```text
IP = photonEnergy - (Ecutoff - EVBM)
photonEnergy = 21.22 eV
```

UPS IPは複数datasetを選択できる。VB set由来の`EF-EVBM`は共通で、各IP datasetごとにIP set内のEVBM、Ecutoff、IPを計算する。

印加電圧依存性は各IP datasetの`appliedVoltage`をx、Ecutoff/EVBM/IPをyとして線形fitする。Band DiagramのIP sourceが`0 V extrapolated`の場合は、IP vs applied voltageのfit切片をIPとして使う。`average`の場合は有効なIP値の算術平均、`dataset`の場合は指定datasetのIP値を使う。

## Gaussian Fit

LEET(der)の選択範囲に対して、offset、amplitude、center、sigmaを推定する。v1では初期推定を重心から作り、Gauss-Newton反復で改善する。

## Bandpass

| Type | Energy/eV |
| ---- | --------: |
| 1    |      4.77 |
| 2    |      4.43 |
| 3    |      4.35 |
| 4    |      3.65 |
| 5    |      4.88 |
| 6    |      5.79 |
| 7    |      3.70 |

任意値を使う場合はcustom bandpass modeとして入力値をそのまま`bandpassEnergy`に使う。

```text
Evac = Epeak + bandpassEnergy
EnergyFromEvac = Evac - Vbias
```

## REELS

raw datasetはKinetic Energyとして保持し、解析時にloss軸へ変換する。

```text
ElectronLossEnergy = incidentEnergy - kineticEnergy
incidentEnergy = 1000 eV
Eg_REELS = intersection(onsetEdgeFit, backgroundFit)
```

`incidentEnergy` はAnalysis ControlsのREELS tabで編集できる。REELS Egは独立解析結果として扱い、UPS-LEIPS Band Diagramの `Eg = IP - EA` には反映しない。
REELS BG single point modeでは、BG cursorの中心点 `(x0, y0)` を使い、BGを `y = y0` の水平線として扱う。
REELS plot上のEg表示は0 eVとEg位置の縦marker、および0 eVからEg位置へ向かう水平矢印で示す。矢印labelの`g`は下付きで表示し、上部marker labelは0 eVのみ表示する。

## Rounding

計算内部は丸めない。UI表示は小数第3位を基本にする。
