import { CurveFactoryParams, CurveLayout } from '../../interfaces/curve-factory.interface';
import { Point } from '../../interfaces/point.interface';
import { Position } from '../../types/position.type';

const handleDirections = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
};

export function getEdgeCenter(source: Point, target: Point): [number, number, number, number] {
  const xOffset = Math.abs(target.x - source.x) / 2;
  const centerX = target.x < source.x ? target.x + xOffset : target.x - xOffset;

  const yOffset = Math.abs(target.y - source.y) / 2;
  const centerY = target.y < source.y ? target.y + yOffset : target.y - yOffset;

  return [centerX, centerY, xOffset, yOffset];
}

const distance = (a: Point, b: Point) => Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));

// With this function we try to mimic a orthogonal edge routing behaviour
// It's not as good as a real orthogonal edge routing but it's faster and good enough as a default for step and smooth step edges
function getPoints({
  source,
  sourcePosition = 'bottom',
  target,
  targetPosition = 'top',
  offset,
}: {
  source: Point;
  sourcePosition: Position;
  target: Point;
  targetPosition: Position;
  offset: number;
}): [Point[], number, number] {
  const sourceDir = handleDirections[sourcePosition];
  const targetDir = handleDirections[targetPosition];
  const sourceGapped: Point = { x: source.x + sourceDir.x * offset, y: source.y + sourceDir.y * offset };
  const targetGapped: Point = { x: target.x + targetDir.x * offset, y: target.y + targetDir.y * offset };

  const [defaultCenterX, defaultCenterY] = getEdgeCenter(source, target);
  let points: Point[] = [];
  let centerX = defaultCenterX;
  let centerY = defaultCenterY;
  const sourceGapOffset = { x: 0, y: 0 };
  const targetGapOffset = { x: 0, y: 0 };

  // opposite handle positions, default case
  if (sourcePosition !== targetPosition) {
    points = [
      { x: sourceGapped.x + sourceGapOffset.x, y: sourceGapped.y + sourceGapOffset.y },
      { x: defaultCenterX, y: defaultCenterY },
      { x: targetGapped.x + targetGapOffset.x, y: targetGapped.y + targetGapOffset.y },
    ];

    const sourceGapPoint = { x: sourceGapped.x + sourceGapOffset.x, y: sourceGapped.y + sourceGapOffset.y };
    const targetGapPoint = { x: targetGapped.x + targetGapOffset.x, y: targetGapped.y + targetGapOffset.y };
    const maxXDistance = Math.max(Math.abs(sourceGapPoint.x - points[0].x), Math.abs(targetGapPoint.x - points[0].x));
    const maxYDistance = Math.max(Math.abs(sourceGapPoint.y - points[0].y), Math.abs(targetGapPoint.y - points[0].y));

    // we want to place the label on the longest segment of the edge
    if (maxXDistance >= maxYDistance) {
      centerX = (sourceGapPoint.x + targetGapPoint.x) / 2;
      centerY = points[0].y;
    } else {
      centerX = points[0].x;
      centerY = (sourceGapPoint.y + targetGapPoint.y) / 2;
    }
  }

  const pathPoints = [
    source,
    { x: sourceGapped.x + sourceGapOffset.x, y: sourceGapped.y + sourceGapOffset.y },
    ...points,
    { x: targetGapped.x + targetGapOffset.x, y: targetGapped.y + targetGapOffset.y },
    target,
  ];

  return [pathPoints, centerX, centerY];
}

function getBend(a: Point, b: Point, c: Point, size: number): string {
  const bendSize = Math.min(distance(a, b) / 2, distance(b, c) / 2, size);
  const { x, y } = b;

  // no bend
  if ((a.x === x && x === c.x) || (a.y === y && y === c.y)) {
    return `L${x} ${y}`;
  }

  // first segment is horizontal
  if (a.y === y) {
    const xDir = a.x < c.x ? -1 : 1;
    const yDir = a.y < c.y ? 1 : -1;
    return `L ${x + bendSize * xDir},${y}Q ${x},${y} ${x},${y + bendSize * yDir}`;
  }

  const xDir = a.x < c.x ? 1 : -1;
  const yDir = a.y < c.y ? -1 : 1;
  return `L ${x},${y + bendSize * yDir}Q ${x},${y} ${x + bendSize * xDir},${y}`;
}

export function smoothStepPath(
  { sourcePoint, targetPoint, sourcePosition, targetPosition, waypoints = [] }: CurveFactoryParams,
  borderRadius: number = 5,
): CurveLayout {
  // If no waypoints, use original smooth step logic
  if (waypoints.length === 0) {
    const [points, labelX, labelY] = getPoints({
      source: sourcePoint,
      sourcePosition,
      target: targetPoint,
      targetPosition,
      offset: 20,
    });

    const path = points.reduce<string>((res, p, i) => {
      let segment = '';

      if (i > 0 && i < points.length - 1) {
        segment = getBend(points[i - 1], p, points[i + 1], borderRadius);
      } else {
        segment = `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`;
      }

      res += segment;

      return res;
    }, '');

    // Performance optimization: Pre-calculate cumulative distances and use binary search
    const n = points.length;
    if (n < 2) {
      return {
        path,
        labelPoints: {
          start: { x: labelX, y: labelY },
          center: { x: labelX, y: labelY },
          end: { x: labelX, y: labelY },
        },
      };
    }

    // Pre-calculate segment lengths and cumulative distances in a single loop
    const segmentLengths: number[] = new Array(n - 1);
    const cumulativeDistances: number[] = new Array(n);
    cumulativeDistances[0] = 0;

    let totalLength = 0;

    for (let i = 0; i < n - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dy = points[i + 1].y - points[i].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      segmentLengths[i] = len;
      totalLength += len;
      cumulativeDistances[i + 1] = totalLength;
    }

    // Optimized helper function using binary search
    const findPointAtDistance = (targetDistance: number): Point => {
      if (targetDistance <= 0) return points[0];
      if (targetDistance >= totalLength) return points[n - 1];

      let left = 0;
      let right = n - 1;

      while (left < right) {
        const mid = Math.floor((left + right) / 2);
        if (cumulativeDistances[mid] < targetDistance) {
          left = mid + 1;
        } else {
          right = mid;
        }
      }

      const segmentIndex = left - 1;
      const segmentStart = points[segmentIndex];
      const segmentEnd = points[segmentIndex + 1];
      const segmentDistance = targetDistance - cumulativeDistances[segmentIndex];
      const segmentRatio = segmentDistance / segmentLengths[segmentIndex];

      return {
        x: segmentStart.x + (segmentEnd.x - segmentStart.x) * segmentRatio,
        y: segmentStart.y + (segmentEnd.y - segmentStart.y) * segmentRatio,
      };
    };

    return {
      path,
      labelPoints: {
        start: findPointAtDistance(totalLength * 0.15),
        center: findPointAtDistance(totalLength * 0.5),
        end: findPointAtDistance(totalLength * 0.85),
      },
    };
  }

  // Build step path through waypoints
  const allPoints = [sourcePoint, ...waypoints, targetPoint];
  let path = `M${sourcePoint.x},${sourcePoint.y}`;

  for (let i = 1; i < allPoints.length; i++) {
    const prev = allPoints[i - 1];
    const curr = allPoints[i];

    // Create step path between points
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal step first
      path += ` L${curr.x},${prev.y}`;
      path += ` L${curr.x},${curr.y}`;
    } else {
      // Vertical step first
      path += ` L${prev.x},${curr.y}`;
      path += ` L${curr.x},${curr.y}`;
    }
  }

  // Calculate label points based on total path length
  const totalLength = calculatePathLength(allPoints);
  const startDistance = totalLength * 0.15;
  const centerDistance = totalLength * 0.5;
  const endDistance = totalLength * 0.85;

  return {
    path,
    labelPoints: {
      start: getPointAtDistance(allPoints, startDistance),
      center: getPointAtDistance(allPoints, centerDistance),
      end: getPointAtDistance(allPoints, endDistance),
    },
  };
}

/**
 * Calculate the total length of a path through multiple points
 */
function calculatePathLength(points: Point[]): number {
  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }
  return totalLength;
}

/**
 * Get a point at a specific distance along a path through multiple points
 */
function getPointAtDistance(points: Point[], targetDistance: number): Point {
  if (points.length < 2) {
    return points[0] || { x: 0, y: 0 };
  }

  let currentDistance = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);

    if (currentDistance + segmentLength >= targetDistance) {
      // Target distance is within this segment
      const ratio = (targetDistance - currentDistance) / segmentLength;
      return {
        x: points[i - 1].x + dx * ratio,
        y: points[i - 1].y + dy * ratio,
      };
    }

    currentDistance += segmentLength;
  }

  // If target distance exceeds path length, return the last point
  return points[points.length - 1];
}
