import { Component } from '@angular/core';
import { ConnectionValidatorFn } from '../vflow/interfaces/connection-settings.interface';
import { Connection } from '../vflow/interfaces/connection.interface';

/**
 * Simple test to verify that enhanced connection data is properly passed through
 */
@Component({
  template: '',
  standalone: true,
})
export class ValidationTestComponent {
  // Test validator that logs the connection data to verify enhancement
  testValidator: ConnectionValidatorFn = (connection: Connection) => {
    console.log('Connection validation data:', {
      basic: {
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
      },
      enhanced: {
        sourceHandleData: connection.sourceHandleData,
        targetHandleData: connection.targetHandleData,
        sourceNodeData: connection.sourceNodeData,
        targetNodeData: connection.targetNodeData,
      }
    });
    
    // Verify that enhanced data is available
    if (connection.sourceHandleData && connection.targetHandleData && 
        connection.sourceNodeData && connection.targetNodeData) {
      console.log('✓ Enhanced connection data is available');
      return true;
    } else {
      console.log('✗ Enhanced connection data is missing');
      return false;
    }
  };

  // Test that validates the data structure
  validateEnhancedConnection(connection: Connection): boolean {
    // Check that basic properties still work
    const hasBasicData = !!(connection.source && connection.target);
    
    // Check that enhanced properties are available when validation runs
    const hasEnhancedData = !!(
      connection.sourceHandleData && 
      connection.targetHandleData && 
      connection.sourceNodeData && 
      connection.targetNodeData
    );

    return hasBasicData && hasEnhancedData;
  }
}