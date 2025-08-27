import { CurveFactoryParams, CurveLayout } from '../../interfaces/curve-factory.interface';
import { getPointOnLineByRatio } from '../point-on-line-by-ratio';
import { combinePointsWithWaypoints, createWaypointPath, calculateWaypointLabelPoints } from './waypoint-path-utils';

export function straightPath({ sourcePoint, targetPoint, waypoints }: CurveFactoryParams): CurveLayout {
  // If waypoints are provided, use them to create a path through all points
  if (waypoints && waypoints.length > 0) {
    const allPoints = combinePointsWithWaypoints(sourcePoint, targetPoint, waypoints);
    const path = createWaypointPath(allPoints);
    const labelPoints = calculateWaypointLabelPoints(allPoints);

    return {
      path,
      labelPoints,
    };
  }

  // Original straight path logic for edges without waypoints
  return {
    path: `M ${sourcePoint.x},${sourcePoint.y}L ${targetPoint.x},${targetPoint.y}`,
    labelPoints: {
      start: getPointOnLineByRatio(sourcePoint, targetPoint, 0.15),
      center: getPointOnLineByRatio(sourcePoint, targetPoint, 0.5),
      end: getPointOnLineByRatio(sourcePoint, targetPoint, 0.85),
    },
  };
}
