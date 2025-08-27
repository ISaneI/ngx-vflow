import { Point } from '../../interfaces/point.interface';

/**
 * Combines source, waypoints, and target into a single array of points
 */
export function combinePointsWithWaypoints(sourcePoint: Point, targetPoint: Point, waypoints?: Point[]): Point[] {
  const points = [sourcePoint];

  if (waypoints && waypoints.length > 0) {
    points.push(...waypoints);
  }

  points.push(targetPoint);
  return points;
}

/**
 * Creates a simple path through waypoints using straight lines
 */
export function createWaypointPath(points: Point[]): string {
  if (points.length < 2) {
    return '';
  }

  let path = `M${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    path += ` L${points[i].x} ${points[i].y}`;
  }

  return path;
}

/**
 * Calculates label points for a path with waypoints
 */
export function calculateWaypointLabelPoints(points: Point[]): {
  start: Point;
  center: Point;
  end: Point;
} {
  if (points.length < 2) {
    const fallback = points[0] || { x: 0, y: 0 };
    return {
      start: fallback,
      center: fallback,
      end: fallback,
    };
  }

  const start = points[0];
  const end = points[points.length - 1];

  // For center, find the middle point along the path
  let center: Point;
  if (points.length === 2) {
    // Simple case: midpoint between start and end
    center = {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    };
  } else {
    // Complex case: find the middle waypoint or interpolate
    const middleIndex = Math.floor(points.length / 2);
    center = points[middleIndex];
  }

  return { start, center, end };
}
