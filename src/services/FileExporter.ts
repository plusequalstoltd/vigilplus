import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SystemMetrics } from '../types';

export interface ExportConfig {
  format?: 'json' | 'csv';
  filePath?: string;
  includeTimestamp?: boolean;
  includeSystemInfo?: boolean;
}

export class FileExporter {
  private defaultConfig: ExportConfig = {
    format: 'json',
    includeTimestamp: true,
    includeSystemInfo: true
  };

  constructor(private config: ExportConfig = {}) {
    this.config = { ...this.defaultConfig, ...config };
  }

  async exportMetrics(metrics: SystemMetrics[], config?: Partial<ExportConfig>): Promise<string> {
    const exportConfig = { ...this.config, ...config };
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    const fileName = exportConfig.filePath || 
      `vigilplus-metrics-${timestamp}.${exportConfig.format}`;
    
    const filePath = path.resolve(fileName);

    try {
      let content: string;
      
      if (exportConfig.format === 'csv') {
        content = this.generateCSV(metrics, exportConfig);
      } else {
        content = this.generateJSON(metrics, exportConfig);
      }

      await fs.promises.writeFile(filePath, content, 'utf8');
      return filePath;
    } catch (error) {
      throw new Error(`Failed to export metrics: ${error}`);
    }
  }

  private generateJSON(metrics: SystemMetrics[], config: ExportConfig): string {
    const exportData: any = {
      exportedAt: new Date().toISOString(),
      metricsCount: metrics.length,
      data: metrics
    };

    if (config.includeSystemInfo) {
      exportData.systemInfo = {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        vigilPlusVersion: process.env.npm_package_version || '1.0.1'
      };
    }

    return JSON.stringify(exportData, null, 2);
  }

  private generateCSV(metrics: SystemMetrics[], config: ExportConfig): string {
    if (metrics.length === 0) {
      return 'No data to export';
    }

    // CSV headers
    const headers = [
      'timestamp',
      'cpu_usage',
      'cpu_cores',
      'cpu_speed',
      'cpu_temperature',
      'memory_usage_percent',
      'memory_used',
      'memory_free',
      'memory_total',
      'disk_usage_percent',
      'disk_read_speed',
      'disk_write_speed',
      'network_download_speed',
      'network_upload_speed'
    ];

    let csv = headers.join(',') + '\n';

    // Add data rows
    metrics.forEach(metric => {
      const row = [
        metric.timestamp,
        metric.cpu.usage || 0,
        metric.cpu.cores || 0,
        metric.cpu.speed || 0,
        metric.cpu.temperature || 0,
        metric.memory.usagePercentage || 0,
        metric.memory.used || 0,
        metric.memory.free || 0,
        metric.memory.total || 0,
        metric.disk.usagePercentage || 0,
        metric.disk.readSpeed || 0,
        metric.disk.writeSpeed || 0,
        metric.network.downloadSpeed || 0,
        metric.network.uploadSpeed || 0
      ];
      csv += row.join(',') + '\n';
    });

    if (config.includeSystemInfo) {
      csv += '\n# System Information\n';
      csv += `# Hostname: ${os.hostname()}\n`;
      csv += `# Platform: ${os.platform()}\n`;
      csv += `# Architecture: ${os.arch()}\n`;
      csv += `# Node Version: ${process.version}\n`;
      csv += `# VigilPlus Version: ${process.env.npm_package_version || '1.0.1'}\n`;
      csv += `# Export Date: ${new Date().toISOString()}\n`;
    }

    return csv;
  }

  static async quickExport(
    metrics: SystemMetrics[], 
    format: 'json' | 'csv' = 'json',
    filePath?: string
  ): Promise<string> {
    const exporter = new FileExporter({ format, filePath });
    return await exporter.exportMetrics(metrics);
  }
} 