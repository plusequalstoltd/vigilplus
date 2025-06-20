import * as si from 'systeminformation';
import { EventEmitter } from 'events';
import {
  SystemMetrics,
  CPUMetrics,
  MemoryMetrics,
  DiskMetrics,
  NetworkMetrics,
  MonitoringConfig,
  HistoricalData
} from '../types';

export class SystemMonitor extends EventEmitter {
  private config: MonitoringConfig;
  private isMonitoring: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private historicalData: HistoricalData;
  private previousNetworkStats: any = null;
  private previousDiskStats: any = null;

  constructor(config: MonitoringConfig) {
    super();
    this.config = config;
    this.historicalData = {
      metrics: [],
      maxEntries: 100
    };
  }

  async start(): Promise<void> {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.emit('started');

    // Initial collection
    await this.collectMetrics();

    // Set up interval
    this.intervalId = setInterval(async () => {
      await this.collectMetrics();
    }, this.config.interval);
  }

  stop(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.emit('stopped');
  }

  private async collectMetrics(): Promise<void> {
    try {
      const [cpu, memory, disk, network] = await Promise.all([
        this.getCPUMetrics(),
        this.getMemoryMetrics(),
        this.getDiskMetrics(),
        this.getNetworkMetrics()
      ]);

      const metrics: SystemMetrics = {
        cpu,
        memory,
        disk,
        network,
        timestamp: new Date()
      };

      this.addToHistory(metrics);
      this.emit('metrics', metrics);
      this.checkAlerts(metrics);

    } catch (error) {
      this.emit('error', error);
    }
  }

  private async getCPUMetrics(): Promise<CPUMetrics> {
    const [cpuLoad, cpuData, cpuTemp] = await Promise.all([
      si.currentLoad(),
      si.cpu(),
      si.cpuTemperature().catch(() => ({ main: undefined }))
    ]);

    return {
      usage: Math.round(cpuLoad.currentLoad * 100) / 100,
      cores: cpuData.cores,
      temperature: cpuTemp.main,
      speed: cpuData.speed,
      loadAverage: cpuLoad.avgLoad ? [cpuLoad.avgLoad] : []
    };
  }

  private async getMemoryMetrics(): Promise<MemoryMetrics> {
    const mem = await si.mem();

    // Calculate actual memory usage (excluding buffers/cache)
    // This matches the Linux 'free' command calculation
    const actualUsed = mem.total - mem.available;
    const usagePercentage = Math.round((actualUsed / mem.total) * 100 * 100) / 100;

    return {
      total: mem.total,
      used: actualUsed, // Use calculated actual used memory
      free: mem.free,
      available: mem.available,
      usagePercentage: usagePercentage,
      swapTotal: mem.swaptotal,
      swapUsed: mem.swapused
    };
  }

  private async getDiskMetrics(): Promise<DiskMetrics> {
    const [diskLayout, fsSize, diskStats] = await Promise.all([
      si.diskLayout(),
      si.fsSize(),
      si.disksIO()
    ]);

    // Calculate disk speeds
    let readSpeed = 0;
    let writeSpeed = 0;

    if (this.previousDiskStats && diskStats) {
      const timeDiff = (Date.now() - this.previousDiskStats.timestamp) / 1000;
      const readDiff = diskStats.rIO - this.previousDiskStats.rIO;
      const writeDiff = diskStats.wIO - this.previousDiskStats.wIO;

      readSpeed = Math.round((readDiff / timeDiff / 1024 / 1024) * 100) / 100; // MB/s
      writeSpeed = Math.round((writeDiff / timeDiff / 1024 / 1024) * 100) / 100; // MB/s
    }

    this.previousDiskStats = {
      rIO: diskStats?.rIO || 0,
      wIO: diskStats?.wIO || 0,
      timestamp: Date.now()
    };

    // Get disk space info
    const mainDisk = fsSize[0] || { size: 0, used: 0, available: 0 };

    return {
      readSpeed,
      writeSpeed,
      totalSpace: mainDisk.size,
      usedSpace: mainDisk.used,
      freeSpace: mainDisk.available,
      usagePercentage: Math.round((mainDisk.used / mainDisk.size) * 100 * 100) / 100
    };
  }

  private async getNetworkMetrics(): Promise<NetworkMetrics> {
    const networkStats = await si.networkStats();
    const primaryInterface = networkStats[0] || {
      rx_bytes: 0,
      tx_bytes: 0,
      rx_sec: 0,
      tx_sec: 0
    };

    // Calculate network speeds
    let downloadSpeed = 0;
    let uploadSpeed = 0;

    if (this.previousNetworkStats) {
      const timeDiff = (Date.now() - this.previousNetworkStats.timestamp) / 1000;
      const rxDiff = primaryInterface.rx_bytes - this.previousNetworkStats.rx_bytes;
      const txDiff = primaryInterface.tx_bytes - this.previousNetworkStats.tx_bytes;

      downloadSpeed = Math.round((rxDiff * 8 / timeDiff / 1024 / 1024) * 100) / 100; // Mbps
      uploadSpeed = Math.round((txDiff * 8 / timeDiff / 1024 / 1024) * 100) / 100; // Mbps
    }

    this.previousNetworkStats = {
      rx_bytes: primaryInterface.rx_bytes,
      tx_bytes: primaryInterface.tx_bytes,
      timestamp: Date.now()
    };

    return {
      bytesReceived: primaryInterface.rx_bytes,
      bytesSent: primaryInterface.tx_bytes,
      packetsReceived: 0, // This would need more detailed tracking
      packetsSent: 0,
      downloadSpeed,
      uploadSpeed
    };
  }

  private addToHistory(metrics: SystemMetrics): void {
    this.historicalData.metrics.push(metrics);
    
    if (this.historicalData.metrics.length > this.historicalData.maxEntries) {
      this.historicalData.metrics.shift();
    }
  }

  private checkAlerts(metrics: SystemMetrics): void {
    for (const alert of this.config.alerts) {
      if (!alert.enabled) continue;

      let value: number;
      switch (alert.metric) {
        case 'cpu':
          value = metrics.cpu.usage;
          break;
        case 'memory':
          value = metrics.memory.usagePercentage;
          break;
        case 'disk':
          value = metrics.disk.usagePercentage;
          break;
        case 'network':
          value = metrics.network.downloadSpeed + metrics.network.uploadSpeed;
          break;
        default:
          continue;
      }

      if (this.checkThreshold(value, alert.threshold, alert.operator)) {
        this.emit('alert', {
          metric: alert.metric,
          value,
          threshold: alert.threshold,
          operator: alert.operator,
          timestamp: metrics.timestamp
        });
      }
    }
  }

  private checkThreshold(value: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '==': return value === threshold;
      default: return false;
    }
  }

  getHistoricalData(): HistoricalData {
    return { ...this.historicalData };
  }

  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.isMonitoring && newConfig.interval) {
      this.stop();
      this.start();
    }
  }
} 