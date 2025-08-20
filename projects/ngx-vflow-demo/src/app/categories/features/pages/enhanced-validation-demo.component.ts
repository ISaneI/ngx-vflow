import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Edge, Node, Vflow, Connection, ConnectionSettings } from 'ngx-vflow';

@Component({
  template: `
    <div class="demo-container">
      <h3>Enhanced Connection Validation Demo</h3>
      <p>This demo shows how to use handle and node data for advanced connection validation.</p>
      <ul>
        <li>Numeric outputs can only connect to numeric inputs</li>
        <li>String outputs can only connect to string inputs</li>
        <li>Value must be within the target's accepted range</li>
      </ul>

      <vflow
        view="auto"
        class="vflow-container"
        [nodes]="nodes"
        [edges]="edges"
        [connection]="connectionSettings"
        (onConnect)="createEdge($event)">
        <ng-template let-ctx nodeHtml>
          <div class="custom-node" [ngClass]="'node-' + ctx.node.data.type">
            <div class="node-header">
              <strong>{{ ctx.node.data.label }}</strong>
              <div class="node-value">Value: {{ ctx.node.data.value }}</div>
            </div>

            @if (ctx.node.data.type === 'output') {
              <div class="data-block">
                Numeric Output ({{ ctx.node.data.value }})
                <handle position="right" type="source" [id]="ctx.node.data.numericOutput" />
              </div>
              <div class="data-block">
                String Output ({{ ctx.node.data.stringValue }})
                <handle position="right" type="source" [id]="ctx.node.data.stringOutput" />
              </div>
            }

            @if (ctx.node.data.type === 'input') {
              <div class="data-block">
                Numeric Input (Range: {{ ctx.node.data.numericRange[0] }}-{{ ctx.node.data.numericRange[1] }})
                <handle position="left" type="target" [id]="ctx.node.data.numericInput" />
              </div>
              <div class="data-block">
                String Input (Max length: {{ ctx.node.data.maxStringLength }})
                <handle position="left" type="target" [id]="ctx.node.data.stringInput" />
              </div>
            }
          </div>
        </ng-template>
      </vflow>

      <div class="validation-info">
        <h4>Validation Rules:</h4>
        <ul>
          <li>Type compatibility: Numeric outputs → Numeric inputs, String outputs → String inputs</li>
          <li>Range validation: Numeric values must be within target's accepted range</li>
          <li>Length validation: String length must not exceed target's max length</li>
        </ul>
      </div>
    </div>
  `,
  styles: [
    `
      .demo-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .vflow-container {
        flex: 1;
        border: 1px solid #ccc;
        border-radius: 4px;
      }

      .custom-node {
        background: white;
        border: 2px solid #ddd;
        border-radius: 8px;
        padding: 12px;
        min-width: 200px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .node-output {
        border-color: #10b981;
        background: #f0fdf4;
      }

      .node-input {
        border-color: #3b82f6;
        background: #eff6ff;
      }

      .node-header {
        margin-bottom: 8px;
        padding-bottom: 8px;
        border-bottom: 1px solid #eee;
      }

      .node-value {
        font-size: 0.875rem;
        color: #666;
        margin-top: 4px;
      }

      .data-block {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        font-size: 0.875rem;
        border-bottom: 1px solid #f3f4f6;
      }

      .data-block:last-child {
        border-bottom: none;
      }

      .validation-info {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 4px;
        border: 1px solid #e9ecef;
      }

      .validation-info h4 {
        margin: 0 0 0.5rem 0;
        color: #495057;
      }

      .validation-info ul {
        margin: 0;
        padding-left: 1.5rem;
      }

      .validation-info li {
        margin-bottom: 0.25rem;
        font-size: 0.875rem;
        color: #6c757d;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [Vflow],
})
export class EnhancedValidationDemoComponent {
  public nodes: Node[] = [
    {
      id: 'output1',
      point: { x: 50, y: 100 },
      type: 'html-template',
      data: {
        type: 'output',
        label: 'Numeric Producer',
        value: 42,
        stringValue: 'Hello',
        numericOutput: 'numOut',
        stringOutput: 'strOut',
      },
    },
    {
      id: 'output2',
      point: { x: 50, y: 300 },
      type: 'html-template',
      data: {
        type: 'output',
        label: 'String Producer',
        value: 150, // Out of range for input1
        stringValue: 'World!',
        numericOutput: 'numOut2',
        stringOutput: 'strOut2',
      },
    },
    {
      id: 'input1',
      point: { x: 400, y: 50 },
      type: 'html-template',
      data: {
        type: 'input',
        label: 'Numeric Consumer',
        numericRange: [0, 100],
        maxStringLength: 10,
        numericInput: 'numIn',
        stringInput: 'strIn',
      },
    },
    {
      id: 'input2',
      point: { x: 400, y: 250 },
      type: 'html-template',
      data: {
        type: 'input',
        label: 'String Consumer',
        numericRange: [0, 200],
        maxStringLength: 5,
        numericInput: 'numIn2',
        stringInput: 'strIn2',
      },
    },
  ];

  public edges: Edge[] = [];

  public connectionSettings: ConnectionSettings = {
    validator: (connection) => {
      // Enhanced validation using handle and node data
      const sourceData = connection.sourceNodeData?.data;
      const targetData = connection.targetNodeData?.data;
      const sourceHandle = connection.sourceHandleData;
      const targetHandle = connection.targetHandleData;

      if (!sourceData || !targetData || !sourceHandle || !targetHandle) {
        return false;
      }

      // Type compatibility check
      const isNumericConnection = sourceHandle.id?.includes('numOut') && targetHandle.id?.includes('numIn');
      const isStringConnection = sourceHandle.id?.includes('strOut') && targetHandle.id?.includes('strIn');

      if (!isNumericConnection && !isStringConnection) {
        return false;
      }

      // Range validation for numeric connections
      if (isNumericConnection) {
        const value = sourceData.value;
        const range = targetData.numericRange;

        if (range && range.length === 2) {
          return value >= range[0] && value <= range[1];
        }
      }

      // Length validation for string connections
      if (isStringConnection) {
        const stringValue = sourceData.stringValue || '';
        const maxLength = targetData.maxStringLength;

        if (maxLength) {
          return stringValue.length <= maxLength;
        }
      }

      return true;
    },
  };

  public createEdge({ source, target, sourceHandle, targetHandle }: Connection) {
    this.edges = [
      ...this.edges,
      {
        id: `${source}-${target}-${sourceHandle}-${targetHandle}`,
        source,
        target,
        sourceHandle,
        targetHandle,
      },
    ];
  }
}
