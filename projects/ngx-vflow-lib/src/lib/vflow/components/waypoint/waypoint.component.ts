import { ChangeDetectionStrategy, Component, input, output, inject, OnDestroy } from '@angular/core';
import { WaypointModel } from '../../models/waypoint.model';
import { EdgeModel } from '../../models/edge.model';
import { align } from '../../utils/align-number';
import { FlowSettingsService } from '../../services/flow-settings.service';
import { ViewportService } from '../../services/viewport.service';
import { Point } from '../../interfaces/point.interface';

@Component({
  standalone: true,
  selector: 'g[waypoint]',
  templateUrl: './waypoint.component.html',
  styleUrls: ['./waypoint.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'waypoint',
    '[class.waypoint--selected]': 'model().selected()',
    '[class.waypoint--dragging]': 'model().dragging()',
  },
})
export class WaypointComponent implements OnDestroy {
  private flowSettingsService = inject(FlowSettingsService);
  private viewportService = inject(ViewportService);

  public model = input.required<WaypointModel>();
  public edgeModel = input.required<EdgeModel>();

  public readonly waypointMove = output<{ waypoint: WaypointModel; position: Point }>();
  public readonly waypointRemove = output<WaypointModel>();
  public readonly waypointSelect = output<WaypointModel>();

  private isDragging = false;
  private dragStartPosition: Point | null = null;
  private waypointStartPosition: Point | null = null;

  public onPointerStart(event: PointerEvent): void {
    event.stopPropagation();
    event.preventDefault();

    if (!this.flowSettingsService.entitiesSelectable()) {
      return;
    }

    this.isDragging = true;
    this.dragStartPosition = { x: event.clientX, y: event.clientY };
    this.waypointStartPosition = { ...this.model().position() };

    this.model().startDrag();
    this.waypointSelect.emit(this.model());

    // Add global event listeners for smooth dragging
    document.addEventListener('pointermove', this.onDocumentPointerMove);
    document.addEventListener('pointerup', this.onDocumentPointerUp);
  }

  private onDocumentPointerMove = (event: PointerEvent): void => {
    if (!this.isDragging || !this.dragStartPosition || !this.waypointStartPosition) {
      return;
    }

    event.preventDefault();

    const zoom = this.viewportService.readableViewport().zoom;
    const [snapX, snapY] = this.flowSettingsService.snapGrid();

    const deltaX = (event.clientX - this.dragStartPosition.x) / zoom;
    const deltaY = (event.clientY - this.dragStartPosition.y) / zoom;

    let newX = this.waypointStartPosition.x + deltaX;
    let newY = this.waypointStartPosition.y + deltaY;

    if (snapX > 1) {
      newX = align(newX, snapX);
    }

    if (snapY > 1) {
      newY = align(newY, snapY);
    }

    const newPosition: Point = { x: newX, y: newY };

    // Update the waypoint model position immediately for visual sync
    this.model().updatePosition(newPosition);

    this.waypointMove.emit({
      waypoint: this.model(),
      position: newPosition,
    });
  };

  private onDocumentPointerUp = (event: PointerEvent): void => {
    if (!this.isDragging) {
      return;
    }

    event.preventDefault();
    this.stopDragging();
  };

  public onPointerEnd(event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    this.stopDragging();
  }

  private stopDragging(): void {
    this.isDragging = false;
    this.dragStartPosition = null;
    this.waypointStartPosition = null;
    this.model().stopDrag();

    // Remove global event listeners
    document.removeEventListener('pointermove', this.onDocumentPointerMove);
    document.removeEventListener('pointerup', this.onDocumentPointerUp);
  }

  public ngOnDestroy(): void {
    // Ensure listeners are removed when component is destroyed
    this.stopDragging();
  }

  public onDoubleClick(event: MouseEvent): void {
    event.stopPropagation();
    this.waypointRemove.emit(this.model());
  }
}
