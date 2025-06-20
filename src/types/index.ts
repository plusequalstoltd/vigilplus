export interface SystemMetrics {
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics;
  network: NetworkMetrics;
  timestamp: Date;
}

export interface CPUMetrics {
  usage: number; // percentage
  cores: number;
  temperature?: number;
  speed: number; // GHz
  loadAverage: number[];
}

export interface MemoryMetrics {
  total: number; // bytes
  used: number; // bytes
  free: number; // bytes
  available: number; // bytes
  usagePercentage: number;
  swapTotal: number;
  swapUsed: number;
}

export interface DiskMetrics {
  readSpeed: number; // MB/s
  writeSpeed: number; // MB/s
  totalSpace: number; // bytes
  usedSpace: number; // bytes
  freeSpace: number; // bytes
  usagePercentage: number;
}

export interface NetworkMetrics {
  bytesReceived: number;
  bytesSent: number;
  packetsReceived: number;
  packetsSent: number;
  downloadSpeed: number; // Mbps
  uploadSpeed: number; // Mbps
}

export interface MonitoringConfig {
  interval: number; // milliseconds
  logToFile: boolean;
  logPath?: string;
  alerts: AlertConfig[];
}

export interface AlertConfig {
  metric: 'cpu' | 'memory' | 'disk' | 'network';
  threshold: number;
  operator: '>' | '<' | '==' | '>=' | '<=';
  enabled: boolean;
}

export interface HistoricalData {
  metrics: SystemMetrics[];
  maxEntries: number;
} 