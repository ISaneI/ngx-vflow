import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WaypointComponent } from './waypoint.component';
import { Point } from '../../interfaces/point.interface';

describe('WaypointComponent', () => {
  let component: WaypointComponent;
  let fixture: ComponentFixture<WaypointComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaypointComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WaypointComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit waypointMove event on mouse down and move', () => {
    const testPoint: Point = { x: 100, y: 100 };
    const testIndex = 0;

    component.point.set(testPoint);
    component.index.set(testIndex);

    const waypointMoveSpy = jest.fn();
    component.waypointMove.subscribe(waypointMoveSpy);

    const mouseEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
    component.onMouseDown(mouseEvent);

    // Simulate mouse move
    const moveEvent = new MouseEvent('mousemove', { clientX: 150, clientY: 150 });
    document.dispatchEvent(moveEvent);

    expect(waypointMoveSpy).toHaveBeenCalledWith({
      point: { x: 150, y: 150 },
      index: testIndex,
    });
  });

  it('should emit waypointClick event on click', () => {
    const testPoint: Point = { x: 100, y: 100 };
    const testIndex = 0;

    component.point.set(testPoint);
    component.index.set(testIndex);

    const waypointClickSpy = jest.fn();
    component.waypointClick.subscribe(waypointClickSpy);

    const clickEvent = new MouseEvent('click');
    component.onClick(clickEvent);

    expect(waypointClickSpy).toHaveBeenCalledWith({
      point: testPoint,
      index: testIndex,
      event: clickEvent,
    });
  });

  it('should emit waypointRemove event on double click', () => {
    const testPoint: Point = { x: 100, y: 100 };
    const testIndex = 0;

    component.point.set(testPoint);
    component.index.set(testIndex);

    const waypointRemoveSpy = jest.fn();
    component.waypointRemove.subscribe(waypointRemoveSpy);

    const doubleClickEvent = new MouseEvent('click', { detail: 2 });
    component.onClick(doubleClickEvent);

    expect(waypointRemoveSpy).toHaveBeenCalledWith(testIndex);
  });
});
