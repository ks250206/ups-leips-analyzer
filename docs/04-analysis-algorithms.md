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

```text
Evac = Epeak + bandpassEnergy
EnergyFromEvac = Evac - Vbias
```

## Rounding

計算内部は丸めない。UI表示は小数第3位を基本にする。
