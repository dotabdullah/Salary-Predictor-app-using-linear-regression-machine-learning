import { DataPoint } from "./data";

export interface RegressionResult {
  meanX: number;
  meanY: number;
  slope: number;
  intercept: number;
  r2: number;
  residualsSumSquares: number;
  totalSumSquares: number;
  equation: string;
  isUndefined: boolean;
  pointsWithPredictions: {
    id: string;
    experience: number;
    salary: number;
    predictedSalary: number;
    residual: number;
    isCustom?: boolean;
  }[];
}

/**
 * Calculates simple linear regression parameters for a given list of data points.
 * Fits y = mx + c where x is experience, y is salary.
 */
export function calculateRegression(points: DataPoint[]): RegressionResult {
  const n = points.length;

  if (n < 2) {
    return {
      meanX: n === 1 ? points[0].experience : 0,
      meanY: n === 1 ? points[0].salary : 0,
      slope: 0,
      intercept: n === 1 ? points[0].salary : 0,
      r2: 0,
      residualsSumSquares: 0,
      totalSumSquares: 0,
      equation: n === 1 ? `y = ${points[0].salary.toFixed(0)}` : "Not enough data",
      isUndefined: false,
      pointsWithPredictions: points.map((p) => ({
        ...p,
        predictedSalary: n === 1 ? points[0].salary : 0,
        residual: 0,
      })),
    };
  }

  // 1. Calculate Means
  let sumX = 0;
  let sumY = 0;
  for (const p of points) {
    sumX += p.experience;
    sumY += p.salary;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  // 2. Calculate Slope (m) and Intercept (c)
  let num = 0; // Sum of (x_i - meanX) * (y_i - meanY)
  let den = 0; // Sum of (x_i - meanX)^2

  for (const p of points) {
    const diffX = p.experience - meanX;
    const diffY = p.salary - meanY;
    num += diffX * diffY;
    den += diffX * diffX;
  }

  // Check for division by zero (e.g. all X values are identical)
  if (den === 0) {
    return {
      meanX,
      meanY,
      slope: 0,
      intercept: meanY,
      r2: 0,
      residualsSumSquares: 0,
      totalSumSquares: 0,
      equation: `x = ${meanX.toFixed(1)} (Vertical Line)`,
      isUndefined: true,
      pointsWithPredictions: points.map((p) => ({
        ...p,
        predictedSalary: meanY,
        residual: p.salary - meanY,
      })),
    };
  }

  const slope = num / den;
  const intercept = meanY - slope * meanX;

  // 3. Calculate R2 (Coefficient of Determination)
  let ssRes = 0; // Sum of squares of residuals
  let ssTot = 0; // Total sum of squares

  const pointsWithPredictions = points.map((p) => {
    const predictedSalary = slope * p.experience + intercept;
    const residual = p.salary - predictedSalary;
    
    ssRes += residual * residual;
    ssTot += (p.salary - meanY) * (p.salary - meanY);

    return {
      ...p,
      predictedSalary,
      residual,
    };
  });

  // If total sum of squares is 0 (all Y values are identical), R2 is 1 if prediction matches perfectly, else 0
  const r2 = ssTot === 0 ? (ssRes === 0 ? 1 : 0) : 1 - ssRes / ssTot;

  const equation = `y = ${slope.toFixed(2)} * x + ${intercept.toFixed(2)}`;

  return {
    meanX,
    meanY,
    slope,
    intercept,
    r2,
    residualsSumSquares: ssRes,
    totalSumSquares: ssTot,
    equation,
    isUndefined: false,
    pointsWithPredictions,
  };
}
