import { Edge } from './edge.interface';

export interface Connection {
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;

  /**
   * Raw handle data for the source handle, including id, type, position, etc.
   * This provides access to handle-specific properties for advanced validation.
   */
  sourceHandleData?: any;

  /**
   * Raw handle data for the target handle, including id, type, position, etc.
   * This provides access to handle-specific properties for advanced validation.
   */
  targetHandleData?: any;

  /**
   * Raw node data for the source node, including any custom data properties.
   * This provides access to node-specific properties for advanced validation.
   */
  sourceNodeData?: any;

  /**
   * Raw node data for the target node, including any custom data properties.
   * This provides access to node-specific properties for advanced validation.
   */
  targetNodeData?: any;
}

export interface ReconnectionEvent {
  connection: Connection;
  oldEdge: Edge;
}
