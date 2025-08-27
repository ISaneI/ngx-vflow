import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Point } from '../../interfaces/point.interface';

@Component({
  standalone: true,
  selector: 'g[waypoint]',
  template: `
    <svg:circle
      class="waypoint-handle"
      r="6"
      fill="white"
      stroke="#1a192b"
      stroke-width="2"
      [attr.cx]="point().x"
      [attr.cy]="point().y"
      (mousedown)="onMouseDown($event)"
      (click)="onClick($event)" />
  `,
  styles: [
    `
      .waypoint-handle {
        cursor: move;
        transition: all 0.1s ease;
      }

      .waypoint-handle:hover {
        r: 8;
        stroke-width: 3;
      }

      .waypoint-handle.selected {
        fill: #1a192b;
        stroke: #1a192b;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaypointComponent {
  public point = input.required<Point>();
  public index = input.required<number>();
  public selected = input(false);

  readonly waypointMove = output<{ point: Point; index: number }>();
  readonly waypointClick = output<{ point: Point; index: number; event: MouseEvent }>();
  readonly waypointRemove = output<number>();

  private isDragging = false;
  private startPoint: Point | null = null;

  onMouseDown(event: MouseEvent): void {
    event.stopPropagation();
    this.isDragging = true;
    this.startPoint = { x: event.clientX, y: event.clientY };

    const onMouseMove = (e: MouseEvent) => {
      if (this.isDragging && this.startPoint) {
        const deltaX = e.clientX - this.startPoint.x;
        const deltaY = e.clientY - this.startPoint.y;

        const newPoint = {
          x: this.point().x + deltaX,
          y: this.point().y + deltaY,
        };

        this.waypointMove.emit({ point: newPoint, index: this.index() });
        this.startPoint = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseUp = () => {
      this.isDragging = false;
      this.startPoint = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  onClick(event: MouseEvent): void {
    if (!this.isDragging) {
      this.waypointClick.emit({ point: this.point(), index: this.index(), event });
    }
  }
}
