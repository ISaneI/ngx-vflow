import { ConnectionMode } from '../types/connection-mode.type';
import { Connection } from './connection.interface';
import { Curve, EdgeType } from './edge.interface';
import { Marker } from './marker.interface';

/**
 * Function to validate connections. Receives a Connection object with optional handle and node data
 * for advanced validation scenarios.
 *
 * @param connection - Connection object containing source/target IDs and optional handle/node data
 * @returns true if the connection is valid, false otherwise
 *
 * @example
 * // Basic validation using only IDs
 * const validator = (connection: Connection) => {
 *   return connection.source !== connection.target;
 * };
 *
 * @example
 * // Advanced validation using handle and node data
 * const validator = (connection: Connection) => {
 *   const sourceData = connection.sourceNodeData?.data;
 *   const targetData = connection.targetNodeData?.data;
 *
 *   // Type compatibility check
 *   return sourceData?.outputType === targetData?.inputType;
 * };
 */
export type ConnectionValidatorFn = (connection: Connection) => boolean;

export interface ConnectionSettings {
  curve?: Curve;
  type?: EdgeType;
  validator?: ConnectionValidatorFn;
  marker?: Marker;
  mode?: ConnectionMode;
}
