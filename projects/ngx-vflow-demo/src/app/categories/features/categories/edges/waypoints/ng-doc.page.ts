import { NgDocPage } from '@ng-doc/core';
import EdgesCategory from '../ng-doc.category';
import { WaypointsDemoComponent } from './demo/waypoints-demo.component';

const WaypointsPage: NgDocPage = {
  title: 'Waypoints',
  mdFile: './index.md',
  category: EdgesCategory,
  demos: { WaypointsDemoComponent },
  order: 4,
};

export default WaypointsPage;
