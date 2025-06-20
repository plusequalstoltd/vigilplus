import * as fs from 'fs';
import * as path from 'path';
import { SystemMetrics, HistoricalData } from '../types';

export interface ExportConfig {
  outputDir: string;
  maxHistoryEntries: number;
  permissions: number; // File permissions (e.g., 0o644)
}

export class FileExporter {
  private config: ExportConfig;
  private currentFile: string;
  private historyFile: string;
  private statsFile: string;

  constructor(config: ExportConfig) {
    this.config = config;
    this.currentFile = path.join(config.outputDir, 'current.json');
    this.historyFile = path.join(config.outputDir, 'history.json');
    this.statsFile = path.join(config.outputDir, 'stats.json');
    
    this.ensureDirectory();
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { 
        recursive: true, 
        mode: 0o755 
      });
    }
  }

  exportCurrentMetrics(metrics: SystemMetrics): void {
    try {
      const data = {
        ...metrics,
        exportedAt: new Date().toISOString(),
        server: this.getServerInfo()
      };

      this.writeSecureFile(this.currentFile, data);
    } catch (error) {
      console.error('Failed to export current metrics:', error);
    }
  }

  exportHistoricalData(history: HistoricalData): void {
    try {
      // Keep only recent entries for security
      const recentHistory = {
        ...history,
        metrics: history.metrics.slice(-this.config.maxHistoryEntries),
        exportedAt: new Date().toISOString()
      };

      this.writeSecureFile(this.historyFile, recentHistory);
    } catch (error) {
      console.error('Failed to export historical data:', error);
    }
  }

  exportStats(metrics: SystemMetrics): void {
    try {
      const stats = {
        summary: {
          cpu: {
            current: metrics.cpu.usage,
            avg: this.calculateAverage('cpu'),
            max: this.calculateMax('cpu')
          },
          memory: {
            current: metrics.memory.usagePercentage,
            avg: this.calculateAverage('memory'),
            max: this.calculateMax('memory')
          },
          temperature: metrics.cpu.temperature || null
        },
        lastUpdate: metrics.timestamp,
        exportedAt: new Date().toISOString()
      };

      this.writeSecureFile(this.statsFile, stats);
    } catch (error) {
      console.error('Failed to export stats:', error);
    }
  }

  private writeSecureFile(filePath: string, data: any): void {
    const jsonData = JSON.stringify(data, null, 2);
    
    // Write to temporary file first (atomic operation)
    const tempFile = `${filePath}.tmp`;
    fs.writeFileSync(tempFile, jsonData, { 
      mode: this.config.permissions,
      encoding: 'utf8'
    });
    
    // Atomic move to final location
    fs.renameSync(tempFile, filePath);
  }

  private getServerInfo(): object {
    return {
      hostname: require('os').hostname(),
      platform: require('os').platform(),
      arch: require('os').arch(),
      // Don't expose sensitive system info
    };
  }

  private calculateAverage(metric: string): number {
    // Implement average calculation from history
    // This is a placeholder - would read from history file
    return 0;
  }

  private calculateMax(metric: string): number {
    // Implement max calculation from history
    // This is a placeholder - would read from history file
    return 0;
  }

  // Clean up old files for security
  cleanupOldFiles(maxAgeHours: number = 24): void {
    const maxAge = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    
    try {
      const files = fs.readdirSync(this.config.outputDir);
      
      for (const file of files) {
        const filePath = path.join(this.config.outputDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < maxAge && file.endsWith('.json')) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old files:', error);
    }
  }
} 