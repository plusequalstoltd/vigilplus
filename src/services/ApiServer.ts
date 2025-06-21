import express from 'express';
import cors from 'cors';
import * as si from 'systeminformation';
import * as os from 'os';
import { SystemMonitor } from './SystemMonitor';
import { SystemMetrics } from '../types';

export class ApiServer {
  private app: express.Application;
  private server: any;
  private systemMonitor: SystemMonitor;
  private latestMetrics: SystemMetrics | null = null;
  private connectedClients: Set<express.Response> = new Set();
  private host: string = '0.0.0.0';

  constructor(systemMonitor: SystemMonitor, private port: number = 3000, host?: string) {
    this.app = express();
    this.systemMonitor = systemMonitor;
    if (host) this.host = host;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupEventListeners();
  }

  private setupMiddleware(): void {
    // Security headers
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });

    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET'],
      allowedHeaders: ['Content-Type', 'Cache-Control']
    }));
    
    this.app.use(express.json({ limit: '1mb' }));
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.1',
        uptime: process.uptime()
      });
    });

    // Get current system metrics
    this.app.get('/api/metrics', (req, res) => {
      if (this.latestMetrics) {
        res.json({
          success: true,
          data: this.latestMetrics,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          success: false,
          message: 'Metrics not available yet',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Server-Sent Events endpoint for real-time updates
    this.app.get('/api/stream', (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Add client to the set
      this.connectedClients.add(res);

      // Send current metrics immediately if available
      if (this.latestMetrics) {
        res.write(`data: ${JSON.stringify(this.latestMetrics)}\n\n`);
      }

      // Handle client disconnect
      req.on('close', () => {
        this.connectedClients.delete(res);
      });

      req.on('error', () => {
        this.connectedClients.delete(res);
      });
    });

    // Get historical data
    this.app.get('/api/history', (req, res) => {
      try {
        const historicalData = this.systemMonitor.getHistoricalData();
        res.json({
          success: true,
          data: historicalData,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to get historical data',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Get system information
    this.app.get('/api/system-info', async (req, res) => {
      try {
        const [system, cpu, mem, osInfo] = await Promise.all([
          si.system(),
          si.cpu(),
          si.mem(),
          si.osInfo()
        ]);

        res.json({
          success: true,
          data: {
            system: {
              manufacturer: system.manufacturer,
              model: system.model,
              version: system.version
            },
            cpu: {
              manufacturer: cpu.manufacturer,
              brand: cpu.brand,
              family: cpu.family,
              model: cpu.model,
              cores: cpu.cores,
              physicalCores: cpu.physicalCores,
              speed: cpu.speed
            },
            memory: {
              total: mem.total
            },
            os: {
              platform: osInfo.platform,
              distro: osInfo.distro,
              release: osInfo.release,
              arch: osInfo.arch,
              hostname: os.hostname()
            }
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to get system information',
          error: process.env.NODE_ENV === 'development' ? error : undefined,
          timestamp: new Date().toISOString()
        });
      }
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        timestamp: new Date().toISOString()
      });
    });
  }

  private setupEventListeners(): void {
    // Listen for new metrics from SystemMonitor
    this.systemMonitor.on('metrics', (metrics: SystemMetrics) => {
      this.latestMetrics = metrics;
      this.broadcastToClients(metrics);
    });

    // Listen for alerts
    this.systemMonitor.on('alert', (alert: any) => {
      const alertData = {
        type: 'alert',
        ...alert
      };
      this.broadcastToClients(alertData);
    });
  }

  private broadcastToClients(data: any): void {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    
    // Remove disconnected clients
    const disconnectedClients: express.Response[] = [];
    
    this.connectedClients.forEach(client => {
      try {
        client.write(message);
      } catch (error) {
        disconnectedClients.push(client);
      }
    });

    // Clean up disconnected clients
    disconnectedClients.forEach(client => {
      this.connectedClients.delete(client);
    });
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, this.host, () => {
          console.log(`�� API Server running on port ${this.port}`);
          console.log(`🔗 Health check: http://${this.host}:${this.port}/health`);
          console.log(`📊 Metrics API: http://${this.host}:${this.port}/api/metrics`);
          console.log(`📺 Real-time stream: http://${this.host}:${this.port}/api/stream`);
          resolve();
        });

        this.server.on('error', (error: any) => {
          if (error.code === 'EADDRINUSE') {
            console.log(`⚠️  Port ${this.port} is busy, trying port ${this.port + 1}...`);
            this.port++;
            this.start().then(resolve).catch(reject);
          } else {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        // Close all SSE connections
        this.connectedClients.forEach(client => {
          try {
            client.end();
          } catch (error) {
            // Ignore errors when closing connections
          }
        });
        this.connectedClients.clear();

        this.server.close(() => {
          console.log('🛑 API Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  public getPort(): number {
    return this.port;
  }
} 