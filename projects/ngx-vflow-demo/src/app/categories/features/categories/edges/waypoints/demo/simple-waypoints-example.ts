import { Edge, Node } from 'ngx-vflow';

// Example nodes
export const nodes: Node[] = [
  {
    id: 'start',
    point: { x: 100, y: 100 },
    type: 'default',
    text: 'Start',
  },
  {
    id: 'end',
    point: { x: 500, y: 300 },
    type: 'default',
    text: 'End',
  },
];

// Example edges with waypoints
export const edges: Edge[] = [
  {
    id: 'edge-with-waypoints',
    source: 'start',
    target: 'end',
    curve: 'bezier',
    waypoints: [
      { x: 200, y: 80 }, // First waypoint
      { x: 350, y: 200 }, // Second waypoint
      { x: 450, y: 250 }, // Third waypoint
    ],
  },
  {
    id: 'edge-straight-waypoints',
    source: 'start',
    target: 'end',
    curve: 'straight',
    waypoints: [
      { x: 300, y: 150 },
      { x: 400, y: 200 },
    ],
  },
  {
    id: 'edge-step-waypoints',
    source: 'start',
    target: 'end',
    curve: 'smooth-step',
    waypoints: [
      { x: 250, y: 120 },
      { x: 400, y: 180 },
    ],
  },
];

// Example of programmatically adding waypoints
export function addWaypointToEdge(edge: Edge, waypoint: { x: number; y: number }): Edge {
  return {
    ...edge,
    waypoints: [...(edge.waypoints || []), waypoint],
  };
}

// Example of removing a waypoint
export function removeWaypointFromEdge(edge: Edge, index: number): Edge {
  if (!edge.waypoints) return edge;

  const newWaypoints = edge.waypoints.filter((_, i) => i !== index);
  return {
    ...edge,
    waypoints: newWaypoints.length > 0 ? newWaypoints : undefined,
  };
}

// Example of updating a waypoint
export function updateWaypoint(edge: Edge, index: number, newPoint: { x: number; y: number }): Edge {
  if (!edge.waypoints || index >= edge.waypoints.length) return edge;

  const newWaypoints = [...edge.waypoints];
  newWaypoints[index] = newPoint;

  return {
    ...edge,
    waypoints: newWaypoints,
  };
}
