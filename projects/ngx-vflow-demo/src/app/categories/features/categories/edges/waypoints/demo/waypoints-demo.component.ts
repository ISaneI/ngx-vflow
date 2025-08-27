import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Connection, Edge, Node, Vflow } from 'ngx-vflow';

@Component({
  template: `
    <div class="demo-container">
      <div class="controls">
        <button (click)="addWaypoint()">Add Waypoint to Edge 1-2</button>
        <button (click)="clearWaypoints()">Clear Waypoints from Edge 1-2</button>
        <button (click)="addSampleWaypoints()">Add Sample Waypoints to Edge 1-2</button>
      </div>

      <vflow view="auto" [nodes]="nodes" [edges]="edges" (onConnect)="createEdge($event)" />
    </div>
  `,
  styles: [
    `
      .demo-container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .controls {
        padding: 10px;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
        display: flex;
        gap: 10px;
      }

      .controls button {
        padding: 8px 16px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      .controls button:hover {
        background: #0056b3;
      }

      vflow {
        flex: 1;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [Vflow],
})
export class WaypointsDemoComponent {
  public nodes: Node[] = [
    {
      id: '1',
      point: { x: 100, y: 100 },
      type: 'default',
      text: 'Node 1',
    },
    {
      id: '2',
      point: { x: 400, y: 300 },
      type: 'default',
      text: 'Node 2',
    },
    {
      id: '3',
      point: { x: 700, y: 150 },
      type: 'default',
      text: 'Node 3',
    },
  ];

  public edges: Edge[] = [
    {
      id: '1-2',
      source: '1',
      target: '2',
      curve: 'step',
      waypoints: [
        { x: 250, y: 80 },
        { x: 350, y: 250 },
      ],
    },
    {
      id: '2-3',
      source: '2',
      target: '3',
      curve: 'smooth-step',
      waypoints: [{ x: 550, y: 200 }],
    },
  ];

  public createEdge({ source, target }: Connection) {
    this.edges = [
      ...this.edges,
      {
        id: `${source} -> ${target}`,
        source,
        target,
        curve: 'bezier',
      },
    ];
  }

  public addWaypoint() {
    // Add waypoint to the first edge (1-2)
    const edgeIndex = this.edges.findIndex((e) => e.id === '1-2');
    if (edgeIndex === -1) return;

    const sourceNode = this.nodes.find((n) => n.id === '1');
    const targetNode = this.nodes.find((n) => n.id === '2');

    if (sourceNode && targetNode) {
      const newWaypoint = {
        x: (sourceNode.point.x + targetNode.point.x) / 2,
        y: (sourceNode.point.y + targetNode.point.y) / 2,
      };

      const updatedEdges = [...this.edges];
      updatedEdges[edgeIndex] = {
        ...updatedEdges[edgeIndex],
        waypoints: [...(updatedEdges[edgeIndex].waypoints || []), newWaypoint],
      };
      this.edges = updatedEdges;
    }
  }

  public clearWaypoints() {
    // Clear waypoints from the first edge (1-2)
    const edgeIndex = this.edges.findIndex((e) => e.id === '1-2');
    if (edgeIndex === -1) return;

    const updatedEdges = [...this.edges];
    updatedEdges[edgeIndex] = { ...updatedEdges[edgeIndex], waypoints: [] };
    this.edges = updatedEdges;
  }

  public addSampleWaypoints() {
    // Add sample waypoints to the first edge (1-2)
    const edgeIndex = this.edges.findIndex((e) => e.id === '1-2');
    if (edgeIndex === -1) return;

    const sampleWaypoints = [
      { x: 200, y: 150 },
      { x: 300, y: 200 },
      { x: 400, y: 180 },
    ];

    const updatedEdges = [...this.edges];
    updatedEdges[edgeIndex] = { ...updatedEdges[edgeIndex], waypoints: sampleWaypoints };
    this.edges = updatedEdges;
  }
}
