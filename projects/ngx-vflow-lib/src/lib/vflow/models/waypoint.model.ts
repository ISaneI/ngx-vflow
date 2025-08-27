import { signal } from '@angular/core';
import { Point } from '../interfaces/point.interface';

export class WaypointModel {
  public position = signal<Point>({ x: 0, y: 0 });
  public selected = signal(false);
  public dragging = signal(false);

  public id: string;

  constructor(id: string, initialPosition: Point) {
    this.id = id;
    this.position.set(initialPosition);
  }

  public updatePosition(point: Point): void {
    this.position.set(point);
  }

  public select(): void {
    this.selected.set(true);
  }

  public deselect(): void {
    this.selected.set(false);
  }

  public startDrag(): void {
    this.dragging.set(true);
  }

  public stopDrag(): void {
    this.dragging.set(false);
  }
}
