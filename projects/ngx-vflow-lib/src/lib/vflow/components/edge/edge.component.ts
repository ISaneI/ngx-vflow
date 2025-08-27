import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  TemplateRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { EdgeLabelComponent } from '../edge-label/edge-label.component';
import { EdgeModel } from '../../models/edge.model';
import { EdgeContext } from '../../interfaces/template-context.interface';
import { SelectionService } from '../../services/selection.service';
import { FlowSettingsService } from '../../services/flow-settings.service';
import { FlowStatusService } from '../../services/flow-status.service';
import { EdgeRenderingService } from '../../services/edge-rendering.service';
import { ConnectionControllerDirective } from '../../directives/connection-controller.directive';
import { HandleModel } from '../../models/handle.model';
import { PointerDirective } from '../../directives/pointer.directive';
import { WaypointComponent } from '../waypoint/waypoint.component';
import { Point } from '../../interfaces/point.interface';

@Component({
  standalone: true,
  selector: 'g[edge]',
  templateUrl: './edge.component.html',
  styleUrls: ['./edge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'selectable',
    '[style.visibility]': 'isReconnecting() ? "hidden" : "visible"',
  },
  imports: [NgTemplateOutlet, EdgeLabelComponent, PointerDirective, WaypointComponent],
})
export class EdgeComponent {
  protected injector = inject(Injector);
  private selectionService = inject(SelectionService);
  private flowSettingsService = inject(FlowSettingsService);
  private flowStatusService = inject(FlowStatusService);
  private edgeRenderingService = inject(EdgeRenderingService);

  // TODO remove dependency from this directive
  private connectionController = inject(ConnectionControllerDirective, { optional: true });

  public model = input.required<EdgeModel>();

  public edgeTemplate = input<TemplateRef<EdgeContext>>();

  public edgeLabelHtmlTemplate = input<TemplateRef<any>>();

  /** Currently selected waypoint index */
  public selectedWaypointIndex = signal<number | null>(null);

  protected isReconnecting = computed(() => {
    const status = this.flowStatusService.status();
    const isReconnecting = status.state === 'reconnection-start' || status.state === 'reconnection-validation';

    return isReconnecting && status.payload.oldEdge === this.model();
  });

  public select() {
    if (this.flowSettingsService.entitiesSelectable()) {
      this.selectionService.select(this.model());
    }
  }

  public pull() {
    if (this.flowSettingsService.elevateEdgesOnSelect()) {
      this.edgeRenderingService.pull(this.model());
    }
  }

  protected startReconnection(event: Event, handle: HandleModel) {
    // ignore drag by stopping propagation
    event.stopPropagation();

    this.connectionController?.startReconnection(handle, this.model());
  }

  /**
   * Handle waypoint movement
   */
  onWaypointMove(event: { point: Point; index: number }): void {
    const waypoints = [...this.model().waypoints()];
    waypoints[event.index] = event.point;
    this.model().waypoints.set(waypoints);
  }

  /**
   * Handle waypoint click
   */
  onWaypointClick(event: { point: Point; index: number; event: MouseEvent }): void {
    // Handle double-click to remove waypoint
    if (event.event.detail === 2) {
      this.onWaypointRemove(event.index);
    } else {
      // Single click to select waypoint
      this.selectedWaypointIndex.set(event.index);
    }
  }

  /**
   * Handle waypoint removal
   */
  onWaypointRemove(index: number): void {
    const waypoints = [...this.model().waypoints()];
    waypoints.splice(index, 1);
    this.model().waypoints.set(waypoints);
    this.selectedWaypointIndex.set(null);
  }
}
