import type { FitRange, GaussianFitResult, LineFitResult, Point } from "./types";

const EPSILON = 1e-12;

export function normalizeRange(range: FitRange): FitRange {
  return range.min <= range.max ? range : { min: range.max, max: range.min };
}

export function selectPointsInRange(points: readonly Point[], range: FitRange): Point[] {
  const normalized = normalizeRange(range);
  return points.filter((point) => point.x >= normalized.min && point.x <= normalized.max);
}

export function linearFit(points: readonly Point[], range: FitRange): LineFitResult {
  const selected = selectPointsInRange(points, range);
  if (selected.length < 2) {
    throw new Error("Linear fit requires at least two points in the selected range.");
  }

  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumXY = 0;
  for (const point of selected) {
    sumX += point.x;
    sumY += point.y;
    sumXX += point.x * point.x;
    sumXY += point.x * point.y;
  }

  const n = selected.length;
  const denominator = n * sumXX - sumX * sumX;
  if (Math.abs(denominator) < EPSILON) {
    throw new Error("Linear fit failed because all x values are effectively identical.");
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  const meanY = sumY / n;
  let ssTotal = 0;
  let ssResidual = 0;
  for (const point of selected) {
    const predicted = intercept + slope * point.x;
    ssTotal += (point.y - meanY) ** 2;
    ssResidual += (point.y - predicted) ** 2;
  }

  return {
    intercept,
    slope,
    rSquared: ssTotal < EPSILON ? 1 : 1 - ssResidual / ssTotal,
    range: normalizeRange(range),
    pointsUsed: selected.length,
  };
}

export function lineIntersection(edge: LineFitResult, background: LineFitResult): number {
  const denominator = background.slope - edge.slope;
  if (Math.abs(denominator) < EPSILON) {
    throw new Error("Cannot calculate intersection for nearly parallel fit lines.");
  }
  return (edge.intercept - background.intercept) / denominator;
}

export function evaluateLine(line: LineFitResult, x: number): number {
  return line.intercept + line.slope * x;
}

export function gaussianFit(points: readonly Point[], range: FitRange): GaussianFitResult {
  const selected = selectPointsInRange(points, range);
  if (selected.length < 4) {
    throw new Error("Gaussian fit requires at least four points in the selected range.");
  }

  let offset = Math.min(...selected.map((point) => point.y));
  let maxPoint = selected[0] ?? { x: 0, y: 0 };
  for (const point of selected) {
    if (point.y > maxPoint.y) {
      maxPoint = point;
    }
  }

  let amplitude = Math.max(maxPoint.y - offset, EPSILON);
  let center = weightedCenter(selected, offset, maxPoint.x);
  let sigma = Math.max(weightedSigma(selected, offset, center), stepEstimate(selected));

  for (let iteration = 0; iteration < 30; iteration += 1) {
    const normal = createNormalSystem(4);
    for (const point of selected) {
      const safeSigma = Math.max(Math.abs(sigma), EPSILON);
      const z = (point.x - center) / safeSigma;
      const expTerm = Math.exp(-0.5 * z * z);
      const predicted = offset + amplitude * expTerm;
      const residual = point.y - predicted;
      const derivatives = [
        1,
        expTerm,
        amplitude * expTerm * ((point.x - center) / (safeSigma * safeSigma)),
        amplitude * expTerm * ((point.x - center) ** 2 / safeSigma ** 3),
      ];
      addToNormalSystem(normal, derivatives, residual);
    }

    const delta = solveLinearSystem(normal.matrix, normal.vector);
    if (!delta) {
      break;
    }

    offset += delta[0] ?? 0;
    amplitude += delta[1] ?? 0;
    center += delta[2] ?? 0;
    sigma = Math.max(Math.abs(sigma + (delta[3] ?? 0)), stepEstimate(selected));

    if (delta.every((value) => Math.abs(value) < 1e-7)) {
      break;
    }
  }

  if (amplitude < 0) {
    amplitude = Math.abs(amplitude);
  }

  const meanY = selected.reduce((sum, point) => sum + point.y, 0) / selected.length;
  let ssTotal = 0;
  let ssResidual = 0;
  for (const point of selected) {
    const predicted = evaluateGaussian({ offset, amplitude, center, sigma }, point.x);
    ssTotal += (point.y - meanY) ** 2;
    ssResidual += (point.y - predicted) ** 2;
  }

  return {
    offset,
    amplitude,
    center,
    sigma,
    rSquared: ssTotal < EPSILON ? 1 : 1 - ssResidual / ssTotal,
    range: normalizeRange(range),
    pointsUsed: selected.length,
  };
}

export function evaluateGaussian(
  gaussian: Pick<GaussianFitResult, "offset" | "amplitude" | "center" | "sigma">,
  x: number,
): number {
  const sigma = Math.max(Math.abs(gaussian.sigma), EPSILON);
  return (
    gaussian.offset + gaussian.amplitude * Math.exp(-0.5 * ((x - gaussian.center) / sigma) ** 2)
  );
}

function weightedCenter(points: readonly Point[], offset: number, fallback: number): number {
  let weightedX = 0;
  let weight = 0;
  for (const point of points) {
    const currentWeight = Math.max(point.y - offset, 0);
    weightedX += point.x * currentWeight;
    weight += currentWeight;
  }
  return weight > EPSILON ? weightedX / weight : fallback;
}

function weightedSigma(points: readonly Point[], offset: number, center: number): number {
  let weightedDistance = 0;
  let weight = 0;
  for (const point of points) {
    const currentWeight = Math.max(point.y - offset, 0);
    weightedDistance += (point.x - center) ** 2 * currentWeight;
    weight += currentWeight;
  }
  return weight > EPSILON ? Math.sqrt(weightedDistance / weight) : stepEstimate(points) * 4;
}

function stepEstimate(points: readonly Point[]): number {
  if (points.length < 2) {
    return 0.01;
  }
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += Math.abs(points[index].x - points[index - 1].x);
  }
  return Math.max(total / (points.length - 1), 0.01);
}

function createNormalSystem(size: number): { matrix: number[][]; vector: number[] } {
  return {
    matrix: Array.from({ length: size }, () => Array.from({ length: size }, () => 0)),
    vector: Array.from({ length: size }, () => 0),
  };
}

function addToNormalSystem(
  normal: { matrix: number[][]; vector: number[] },
  derivatives: readonly number[],
  residual: number,
): void {
  for (let row = 0; row < derivatives.length; row += 1) {
    normal.vector[row] += derivatives[row] * residual;
    for (let column = 0; column < derivatives.length; column += 1) {
      normal.matrix[row][column] += derivatives[row] * derivatives[column];
    }
  }
}

function solveLinearSystem(matrix: number[][], vector: number[]): number[] | undefined {
  const size = vector.length;
  const augmented = matrix.map((row, index) => [...row, vector[index]]);

  for (let pivotIndex = 0; pivotIndex < size; pivotIndex += 1) {
    let pivotRow = pivotIndex;
    for (let row = pivotIndex + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][pivotIndex]) > Math.abs(augmented[pivotRow][pivotIndex])) {
        pivotRow = row;
      }
    }

    if (Math.abs(augmented[pivotRow][pivotIndex]) < EPSILON) {
      return undefined;
    }

    [augmented[pivotIndex], augmented[pivotRow]] = [augmented[pivotRow], augmented[pivotIndex]];
    const pivot = augmented[pivotIndex][pivotIndex];
    for (let column = pivotIndex; column <= size; column += 1) {
      augmented[pivotIndex][column] /= pivot;
    }

    for (let row = 0; row < size; row += 1) {
      if (row === pivotIndex) {
        continue;
      }
      const factor = augmented[row][pivotIndex];
      for (let column = pivotIndex; column <= size; column += 1) {
        augmented[row][column] -= factor * augmented[pivotIndex][column];
      }
    }
  }

  return augmented.map((row) => row[size]);
}
