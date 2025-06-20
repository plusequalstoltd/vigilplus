// Core classes
export { SystemMonitor } from './services/SystemMonitor';
export { ConsoleDisplay } from './display/ConsoleDisplay';

// Types
export * from './types';

// Utilities
export * from './utils/formatters';

// Default configuration
export const defaultConfig = {
  interval: 2000,
  logToFile: false,
  alerts: [
    {
      metric: 'cpu' as const,
      threshold: 80,
      operator: '>' as const,
      enabled: true
    },
    {
      metric: 'memory' as const,
      threshold: 85,
      operator: '>' as const,
      enabled: true
    },
    {
      metric: 'disk' as const,
      threshold: 90,
      operator: '>' as const,
      enabled: true
    }
  ]
}; 