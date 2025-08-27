import { CurveFactoryParams, CurveLayout } from '../../interfaces/curve-factory.interface';
import { getPointOnLineByRatio } from '../point-on-line-by-ratio';

export function straightPath({ sourcePoint, targetPoint, waypoints = [] }: CurveFactoryParams): CurveLayout {
  // If no waypoints, use simple straight line
  if (waypoints.length === 0) {
    return {
      path: `M ${sourcePoint.x},${sourcePoint.y}L ${targetPoint.x},${targetPoint.y}`,
      labelPoints: {
        start: getPointOnLineByRatio(sourcePoint, targetPoint, 0.15),
        center: getPointOnLineByRatio(sourcePoint, targetPoint, 0.5),
        end: getPointOnLineByRatio(sourcePoint, targetPoint, 0.85),
      },
    };
  }

  // Build path through all waypoints
  const allPoints = [sourcePoint, ...waypoints, targetPoint];
  let path = `M ${sourcePoint.x},${sourcePoint.y}`;

  for (let i = 1; i < allPoints.length; i++) {
    path += ` L ${allPoints[i].x},${allPoints[i].y}`;
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
function calculatePathLength(points: { x: number; y: number }[]): number {
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
function getPointAtDistance(points: { x: number; y: number }[], targetDistance: number): { x: number; y: number } {
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
