import { Connection } from './connection.interface';
import { NodeHandle } from '../services/handle.service';

describe('Connection Interface', () => {
  it('should support basic connection properties', () => {
    const connection: Connection = {
      source: 'node1',
      target: 'node2',
      sourceHandle: 'handle1',
      targetHandle: 'handle2',
    };

    expect(connection.source).toBe('node1');
    expect(connection.target).toBe('node2');
    expect(connection.sourceHandle).toBe('handle1');
    expect(connection.targetHandle).toBe('handle2');
  });

  it('should support enhanced connection properties with handle and node data', () => {
    const sourceHandleData: NodeHandle = {
      id: 'handle1',
      type: 'source',
      position: 'right',
      userOffsetX: 0,
      userOffsetY: 0,
    };

    const targetHandleData: NodeHandle = {
      id: 'handle2',
      type: 'target',
      position: 'left',
      userOffsetX: 0,
      userOffsetY: 0,
    };

    const sourceNodeData = {
      id: 'node1',
      type: 'html-template',
      point: { x: 0, y: 0 },
      data: { label: 'Source Node', value: 100 },
    };

    const targetNodeData = {
      id: 'node2',
      type: 'html-template',
      point: { x: 200, y: 100 },
      data: { label: 'Target Node', value: 200 },
    };

    const connection: Connection = {
      source: 'node1',
      target: 'node2',
      sourceHandle: 'handle1',
      targetHandle: 'handle2',
      sourceHandleData,
      targetHandleData,
      sourceNodeData,
      targetNodeData,
    };

    expect(connection.sourceHandleData).toEqual(sourceHandleData);
    expect(connection.targetHandleData).toEqual(targetHandleData);
    expect(connection.sourceNodeData).toEqual(sourceNodeData);
    expect(connection.targetNodeData).toEqual(targetNodeData);

    // Validate we can access the data for validation
    expect(connection.sourceNodeData?.data?.value).toBe(100);
    expect(connection.targetNodeData?.data?.value).toBe(200);
    expect(connection.sourceHandleData?.type).toBe('source');
    expect(connection.targetHandleData?.type).toBe('target');
  });

  it('should work with basic validation that ignores enhanced data', () => {
    const connection: Connection = {
      source: 'node1',
      target: 'node2',
      sourceHandle: 'handle1',
      targetHandle: 'handle2',
      sourceHandleData: { id: 'handle1', type: 'source', position: 'right', userOffsetX: 0, userOffsetY: 0 },
      targetHandleData: { id: 'handle2', type: 'target', position: 'left', userOffsetX: 0, userOffsetY: 0 },
      sourceNodeData: { id: 'node1', data: { value: 100 } },
      targetNodeData: { id: 'node2', data: { value: 200 } },
    };

    // Example of existing validator that only uses basic properties
    const notSelfValidator = (conn: Connection) => conn.source !== conn.target;
    const hasHandlesValidator = (conn: Connection) =>
      conn.sourceHandle !== undefined && conn.targetHandle !== undefined;

    expect(notSelfValidator(connection)).toBe(true);
    expect(hasHandlesValidator(connection)).toBe(true);
  });

  it('should enable advanced validation using handle and node data', () => {
    const connection: Connection = {
      source: 'outputNode',
      target: 'inputNode',
      sourceHandle: 'numericOutput',
      targetHandle: 'numericInput',
      sourceHandleData: {
        id: 'numericOutput',
        type: 'source',
        position: 'right',
        userOffsetX: 0,
        userOffsetY: 0,
      },
      targetHandleData: {
        id: 'numericInput',
        type: 'target',
        position: 'left',
        userOffsetX: 0,
        userOffsetY: 0,
      },
      sourceNodeData: {
        id: 'outputNode',
        data: { outputType: 'number', value: 42 },
      },
      targetNodeData: {
        id: 'inputNode',
        data: { inputType: 'number', acceptedRange: [0, 100] },
      },
    };

    // Example of advanced validator that uses handle and node data
    const typeCompatibilityValidator = (conn: Connection) => {
      if (!conn.sourceNodeData?.data || !conn.targetNodeData?.data) {
        return false;
      }

      const sourceType = conn.sourceNodeData.data.outputType;
      const targetType = conn.targetNodeData.data.inputType;

      return sourceType === targetType;
    };

    const valueRangeValidator = (conn: Connection) => {
      if (!conn.sourceNodeData?.data || !conn.targetNodeData?.data) {
        return false;
      }

      const value = conn.sourceNodeData.data.value;
      const acceptedRange = conn.targetNodeData.data.acceptedRange;

      if (!acceptedRange || acceptedRange.length !== 2) {
        return true; // No range validation needed
      }

      return value >= acceptedRange[0] && value <= acceptedRange[1];
    };

    expect(typeCompatibilityValidator(connection)).toBe(true);
    expect(valueRangeValidator(connection)).toBe(true);

    // Test with incompatible types
    const incompatibleConnection: Connection = {
      ...connection,
      sourceNodeData: {
        id: 'outputNode',
        data: { outputType: 'string', value: 'hello' },
      },
    };

    expect(typeCompatibilityValidator(incompatibleConnection)).toBe(false);
  });
});
