import { CurveFactoryParams, CurveLayout } from '../../interfaces/curve-factory.interface';
import { Point } from '../../interfaces/point.interface';
import { Position } from '../../types/position.type';
import { getPointOnLineByRatio } from '../point-on-line-by-ratio';

export function bezierPath({
  sourcePoint,
  targetPoint,
  sourcePosition,
  targetPosition,
  waypoints = [],
}: CurveFactoryParams): CurveLayout {
  // If no waypoints, use simple bezier curve
  if (waypoints.length === 0) {
    const distanceVector = { x: sourcePoint.x - targetPoint.x, y: sourcePoint.y - targetPoint.y };

    const sourceControl = calcControlPoint(sourcePoint, sourcePosition, distanceVector);
    const targetControl = calcControlPoint(targetPoint, targetPosition, distanceVector);

    const path = `M${sourcePoint.x},${sourcePoint.y} C${sourceControl.x},${sourceControl.y} ${targetControl.x},${targetControl.y} ${targetPoint.x},${targetPoint.y}`;

    return getPathData(path, sourcePoint, targetPoint, sourceControl, targetControl);
  }

  // Build smooth bezier curve through waypoints
  const allPoints = [sourcePoint, ...waypoints, targetPoint];
  let path = `M${sourcePoint.x},${sourcePoint.y}`;

  if (allPoints.length === 2) {
    // Only source and target, use simple bezier
    const distanceVector = { x: sourcePoint.x - targetPoint.x, y: sourcePoint.y - targetPoint.y };
    const sourceControl = calcControlPoint(sourcePoint, sourcePosition, distanceVector);
    const targetControl = calcControlPoint(targetPoint, targetPosition, distanceVector);
    path += ` C${sourceControl.x},${sourceControl.y} ${targetControl.x},${targetControl.y} ${targetPoint.x},${targetPoint.y}`;
  } else {
    // Multiple points, create smooth curve through waypoints
    for (let i = 1; i < allPoints.length; i++) {
      const prev = allPoints[i - 1];
      const curr = allPoints[i];
      const next = allPoints[i + 1];

      if (i === 1) {
        // First segment: from source to first waypoint
        const distanceVector = { x: prev.x - curr.x, y: prev.y - curr.y };
        const sourceControl = calcControlPoint(prev, sourcePosition, distanceVector);
        const targetControl = calcControlPoint(curr, 'bottom', distanceVector);
        path += ` C${sourceControl.x},${sourceControl.y} ${targetControl.x},${targetControl.y} ${curr.x},${curr.y}`;
      } else if (i === allPoints.length - 1) {
        // Last segment: from last waypoint to target
        const distanceVector = { x: prev.x - curr.x, y: prev.y - curr.y };
        const sourceControl = calcControlPoint(prev, 'top', distanceVector);
        const targetControl = calcControlPoint(curr, targetPosition, distanceVector);
        path += ` C${sourceControl.x},${sourceControl.y} ${targetControl.x},${targetControl.y} ${curr.x},${curr.y}`;
      } else {
        // Middle segments: smooth curve between waypoints
        const control1 = getSmoothControlPoint(prev, curr, next, false);
        const control2 = getSmoothControlPoint(prev, curr, next, true);
        path += ` C${control1.x},${control1.y} ${control2.x},${control2.y} ${curr.x},${curr.y}`;
      }
    }
  }

  // For waypoint paths, use simplified label point calculation
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
 * Calculate control point for smooth curve between waypoints
 */
function getSmoothControlPoint(prev: Point, curr: Point, next: Point, isEnd: boolean): Point {
  const tension = 0.3; // Controls curve smoothness
  const dx = next.x - prev.x;
  const dy = next.y - prev.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) {
    return curr;
  }

  const factor = (tension * distance) / 2;

  if (isEnd) {
    return {
      x: curr.x - (dx / distance) * factor,
      y: curr.y - (dy / distance) * factor,
    };
  } else {
    return {
      x: curr.x + (dx / distance) * factor,
      y: curr.y + (dy / distance) * factor,
    };
  }
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

/**
 * Calculate control point based on provided point
 *
 * @param point relative this point control point is gonna be computed (the source or the target)
 * @param pointPosition position of {point} on block
 * @param distanceVector transmits the distance between the source and the target as x and y coordinates
 */

function calcControlPoint(point: Point, pointPosition: Position, distanceVector: Point) {
  const factorPoint = { x: 0, y: 0 };

  switch (pointPosition) {
    case 'top':
      factorPoint.y = 1;
      break;
    case 'bottom':
      factorPoint.y = -1;
      break;
    case 'right':
      factorPoint.x = 1;
      break;
    case 'left':
      factorPoint.x = -1;
      break;
  }

  // TODO: explain name
  const fullDistanceVector = {
    x: distanceVector.x * Math.abs(factorPoint.x),
    y: distanceVector.y * Math.abs(factorPoint.y),
  };

  // TODO: probably need to make this configurable
  const curvature = 0.25;
  // thanks colleagues from react/svelte world
  // https://github.com/xyflow/xyflow/blob/f0117939bae934447fa7f232081f937169ee23b5/packages/system/src/utils/edges/bezier-edge.ts#L56
  const controlOffset = curvature * 25 * Math.sqrt(Math.abs(fullDistanceVector.x + fullDistanceVector.y));

  return {
    x: point.x + factorPoint.x * controlOffset,
    y: point.y - factorPoint.y * controlOffset,
  };
}

function getPathData(
  path: string,
  source: Point,
  target: Point,
  sourceControl: Point,
  targetControl: Point,
): CurveLayout {
  return {
    path,
    labelPoints: {
      start: getPointOnLineByRatio(source, sourceControl, 0.5),
      center: getPointOnLineByRatio(sourceControl, targetControl, 0.5),
      end: getPointOnLineByRatio(targetControl, target, 0.5),
    },
  };
}
