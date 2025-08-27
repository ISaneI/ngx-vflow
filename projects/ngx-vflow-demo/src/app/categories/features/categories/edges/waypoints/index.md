# {{ NgDocPage.title }}

Waypoints allow you to create custom paths for edges by defining intermediate points that the edge must pass through. This feature is similar to JointJS link waypoints and provides both programmatic and interactive ways to control edge routing.

## Basic Usage

Waypoints are defined as an array of `Point` objects in the edge configuration:

```typescript
const edge: Edge = {
  id: 'edge-1',
  source: 'node-1',
  target: 'node-2',
  curve: 'bezier',
  waypoints: [
    { x: 200, y: 150 },
    { x: 300, y: 200 },
    { x: 400, y: 180 },
  ],
};
```

## Supported Curve Types

Waypoints work with all curve types:

- **Straight**: Creates a polyline through all waypoints
- **Bezier**: Creates smooth curves between waypoints
- **Smooth-step**: Creates orthogonal step paths through waypoints
- **Step**: Creates orthogonal step paths through waypoints

## Interactive Editing

When an edge is selected, waypoint handles become visible and interactive:

- **Drag**: Move waypoints by dragging the handles
- **Click**: Select a waypoint (single click)
- **Double-click**: Remove a waypoint (double-click)

## Programmatic Control

You can programmatically add, remove, or modify waypoints:

```typescript
// Add a waypoint
const newWaypoint = { x: 250, y: 175 };
edge.waypoints = [...(edge.waypoints || []), newWaypoint];

// Remove a waypoint
edge.waypoints = edge.waypoints?.filter((_, index) => index !== 0);

// Clear all waypoints
edge.waypoints = [];
```

## Demo

The demo below shows waypoints in action. Select an edge to see the waypoint handles, then try:

- Dragging waypoints to move them
- Double-clicking waypoints to remove them
- Using the buttons to add sample waypoints or clear them

{{ NgDocActions.demoPane("WaypointsDemoComponent") }}

## API Reference

### Edge Interface

```typescript
interface Edge {
  // ... other properties
  waypoints?: Point[];
}
```

### Point Interface

```typescript
interface Point {
  x: number;
  y: number;
}
```

## Implementation Details

Waypoints are integrated into the existing path calculation system:

1. **Path Generation**: Each curve type has been updated to handle waypoints
2. **Label Positioning**: Label points are calculated based on the total path length through waypoints
3. **Interactive Components**: Waypoint handles are rendered when edges are selected
4. **State Management**: Waypoint changes are reactive and trigger path recalculation

## Best Practices

- Use waypoints sparingly to avoid cluttered diagrams
- Consider the curve type when placing waypoints (bezier curves work best with smooth paths)
- Provide visual feedback when waypoints are being edited
- Allow users to easily add/remove waypoints through intuitive interactions
