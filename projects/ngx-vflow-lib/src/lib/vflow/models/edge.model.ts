import { computed, effect, inject, signal, untracked, WritableSignal } from '@angular/core';
import { EdgeLabelPosition } from '../interfaces/edge-label.interface';
import { Edge, Curve, EdgeType } from '../interfaces/edge.interface';
import { EdgeLabelModel } from './edge-label.model';
import { NodeModel } from './node.model';
import { straightPath } from '../math/edge-path/straigh-path';
import { bezierPath } from '../math/edge-path/bezier-path';
import { toObservable } from '@angular/core/rxjs-interop';
import { FlowEntity } from '../interfaces/flow-entity.interface';
import { smoothStepPath } from '../math/edge-path/smooth-step-path';
import { hashCode } from '../utils/hash';
import { Contextable } from '../interfaces/contextable.interface';
import { EdgeContext } from '../interfaces/template-context.interface';
import { HandleModel } from './handle.model';
import { CurveFactoryParams } from '../interfaces/curve-factory.interface';
import { FlowEntitiesService } from '../services/flow-entities.service';
import { extendedComputed } from '../utils/signals/extended-computed';
import { WaypointModel } from './waypoint.model';
import { Point } from '../interfaces/point.interface';

export class EdgeModel implements FlowEntity, Contextable<EdgeContext> {
  private readonly flowEntitiesService = inject(FlowEntitiesService);

  public source = signal<NodeModel | undefined>(undefined);
  public target = signal<NodeModel | undefined>(undefined);
  public curve: Curve;
  public type: EdgeType;
  public reconnectable: boolean | 'source' | 'target';
  public floating: boolean;

  public selected = signal(false);
  public selected$ = toObservable(this.selected);

  public renderOrder = signal(0);

  public detached = computed(() => {
    const source = this.source();
    const target = this.target();

    if (!source || !target) {
      return true;
    }

    let existsSourceHandle = false;
    let existsTargetHandle = false;

    if (this.edge.sourceHandle) {
      existsSourceHandle = !!source.handles().find((handle) => handle.rawHandle.id === this.edge.sourceHandle);
    } else {
      existsSourceHandle = !!source.handles().find((handle) => handle.rawHandle.type === 'source');
    }

    if (this.edge.targetHandle) {
      existsTargetHandle = !!target.handles().find((handle) => handle.rawHandle.id === this.edge.targetHandle);
    } else {
      existsTargetHandle = !!target.handles().find((handle) => handle.rawHandle.type === 'target');
    }

    return !existsSourceHandle || !existsTargetHandle;
  });

  public detached$ = toObservable(this.detached);

  public path = computed(() => {
    const source = this.sourceHandle();
    const target = this.targetHandle();

    // TODO: don't like this
    if (!source || !target) {
      return {
        path: '',
        labelPoints: {
          start: { x: 0, y: 0 },
          center: { x: 0, y: 0 },
          end: { x: 0, y: 0 },
        },
      };
    }

    const params = this.getPathFactoryParams(source, target);

    switch (this.curve) {
      case 'straight':
        return straightPath(params);
      case 'bezier':
        return bezierPath(params);
      case 'smooth-step':
        return smoothStepPath(params);
      case 'step':
        return smoothStepPath(params, 0);
      default:
        return this.curve(params);
    }
  });

  public sourceHandle = extendedComputed<HandleModel | null>((previousHandle) => {
    let handle: HandleModel | null = null;

    if (this.floating) {
      handle = this.closestHandles().sourceHandle;
    } else {
      if (this.edge.sourceHandle) {
        handle =
          this.source()
            ?.handles()
            .find((handle) => handle.rawHandle.id === this.edge.sourceHandle) ?? null;
      } else {
        handle =
          this.source()
            ?.handles()
            .find((handle) => handle.rawHandle.type === 'source') ?? null;
      }
    }

    // In case of virtual scrolling, if the node is scrolled out of view the handle may disappear
    // which could lead to the edge not being rendered
    // so we return the previous handle if the current one is null
    // TODO: check if this breaks anything
    if (handle === null) {
      return previousHandle;
    }

    return handle;
  });

  public targetHandle = extendedComputed<HandleModel | null>((previousHandle) => {
    let handle: HandleModel | null = null;

    if (this.floating) {
      handle = this.closestHandles().targetHandle;
    } else {
      if (this.edge.targetHandle) {
        handle =
          this.target()
            ?.handles()
            .find((handle) => handle.rawHandle.id === this.edge.targetHandle) ?? null;
      } else {
        handle =
          this.target()
            ?.handles()
            .find((handle) => handle.rawHandle.type === 'target') ?? null;
      }
    }

    // In case of virtual scrolling, if the node is scrolled out of view the handle may disappear
    // which could lead to the edge not being rendered
    // so we return the previous handle if the current one is null
    // TODO: check if this breaks anything
    if (handle === null) {
      return previousHandle;
    }

    return handle;
  });

  public closestHandles = computed(() => {
    const source = this.source();
    const target = this.target();

    if (!source || !target) {
      return { sourceHandle: null, targetHandle: null };
    }

    // Get all source handles from source node
    const sourceHandles =
      this.flowEntitiesService.connection().mode === 'strict'
        ? source.handles().filter((h) => h.rawHandle.type === 'source')
        : source.handles();
    // Get all target handles from target node
    const targetHandles =
      this.flowEntitiesService.connection().mode === 'strict'
        ? target.handles().filter((h) => h.rawHandle.type === 'target')
        : target.handles();

    if (sourceHandles.length === 0 || targetHandles.length === 0) {
      return { sourceHandle: null, targetHandle: null };
    }

    let minDistance = Infinity;
    let closestSourceHandle: HandleModel | null = null;
    let closestTargetHandle: HandleModel | null = null;

    // Check all combinations of source and target handles
    for (const sourceHandle of sourceHandles) {
      for (const targetHandle of targetHandles) {
        const sourcePoint = sourceHandle.pointAbsolute();
        const targetPoint = targetHandle.pointAbsolute();

        const distance = Math.sqrt(
          Math.pow(sourcePoint.x - targetPoint.x, 2) + Math.pow(sourcePoint.y - targetPoint.y, 2),
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestSourceHandle = sourceHandle;
          closestTargetHandle = targetHandle;
        }
      }
    }

    return {
      sourceHandle: closestSourceHandle,
      targetHandle: closestTargetHandle,
    };
  });

  /**
   * TODO: not reactive
   */
  public markerStartUrl = computed(() => {
    const marker = this.edge.markers?.start;

    return marker ? `url(#${hashCode(JSON.stringify(marker))})` : '';
  });

  /**
   * TODO: not reactive
   */
  public markerEndUrl = computed(() => {
    const marker = this.edge.markers?.end;

    return marker ? `url(#${hashCode(JSON.stringify(marker))})` : '';
  });

  public context = {
    $implicit: {
      // TODO: check if edge could change
      edge: this.edge,
      path: computed(() => this.path().path),
      markerStart: this.markerStartUrl,
      markerEnd: this.markerEndUrl,
      selected: this.selected.asReadonly(),
    },
  };

  public edgeLabels: { [position in EdgeLabelPosition]?: EdgeLabelModel } = {};

  public waypoints: WritableSignal<WaypointModel[]> = signal([]);

  private waypointIdCounter = 0;

  constructor(public edge: Edge) {
    this.type = edge.type ?? 'default';
    this.curve = edge.curve ?? 'bezier';
    this.reconnectable = edge.reconnectable ?? false;
    this.floating = edge.floating ?? false;

    if (edge.edgeLabels?.start) this.edgeLabels.start = new EdgeLabelModel(edge.edgeLabels.start);
    if (edge.edgeLabels?.center) this.edgeLabels.center = new EdgeLabelModel(edge.edgeLabels.center);
    if (edge.edgeLabels?.end) this.edgeLabels.end = new EdgeLabelModel(edge.edgeLabels.end);

    // Initialize waypoints from edge data
    if (edge.waypoints) {
      const waypointModels = edge.waypoints.map(
        (point) => new WaypointModel(`${edge.id}-waypoint-${this.waypointIdCounter++}`, point),
      );
      this.waypoints.set(waypointModels);
    }

    // Sync waypoints signal with edge data
    effect(() => {
      const waypoints = this.waypoints();
      untracked(() => {
        if (waypoints.length > 0) {
          this.edge.waypoints = waypoints.map((wp) => wp.position());
        } else {
          delete this.edge.waypoints;
        }
      });
    });
  }

  /**
   * Add a waypoint at the specified position
   */
  public addWaypoint(point: Point, index?: number): void {
    const waypointId = `${this.edge.id}-waypoint-${this.waypointIdCounter++}`;
    const newWaypoint = new WaypointModel(waypointId, point);

    this.waypoints.update((waypoints) => {
      const newWaypoints = [...waypoints];
      if (index !== undefined && index >= 0 && index <= newWaypoints.length) {
        newWaypoints.splice(index, 0, newWaypoint);
      } else {
        newWaypoints.push(newWaypoint);
      }
      return newWaypoints;
    });
  }

  /**
   * Remove a waypoint by its model
   */
  public removeWaypoint(waypoint: WaypointModel): void {
    this.waypoints.update((waypoints) => waypoints.filter((wp) => wp.id !== waypoint.id));
  }

  /**
   * Remove a waypoint by its index
   */
  public removeWaypointAt(index: number): void {
    this.waypoints.update((waypoints) => {
      if (index >= 0 && index < waypoints.length) {
        const newWaypoints = [...waypoints];
        newWaypoints.splice(index, 1);
        return newWaypoints;
      }
      return waypoints;
    });
  }

  /**
   * Update a waypoint position
   */
  public updateWaypointPosition(waypoint: WaypointModel, newPosition: Point): void {
    waypoint.updatePosition(newPosition);

    // Trigger effect to update edge.waypoints
    this.waypoints.update((waypoints) => [...waypoints]);
  }

  /**
   * Clear all waypoints
   */
  public clearWaypoints(): void {
    this.waypoints.set([]);
  }

  private getPathFactoryParams(source: HandleModel, target: HandleModel): CurveFactoryParams {
    return {
      mode: 'edge',
      edge: this.edge,
      sourcePoint: source.pointAbsolute(),
      targetPoint: target.pointAbsolute(),
      sourcePosition: source.rawHandle.position,
      targetPosition: target.rawHandle.position,
      allEdges: this.flowEntitiesService.rawEdges(),
      allNodes: this.flowEntitiesService.rawNodes(),
      waypoints: this.waypoints().map((wp) => wp.position()),
    };
  }
}
