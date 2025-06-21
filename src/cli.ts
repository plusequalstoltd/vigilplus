#!/usr/bin/env node

import { parseArgs, showHelp } from './utils/cli-parser';
import { colors } from './utils/colors';
import { SystemMonitor } from './services/SystemMonitor';
import { ApiServer } from './services/ApiServer';
import { ConsoleDisplay } from './display/ConsoleDisplay';
import { MonitoringConfig } from './types';

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    showHelp('vigilplus');
    process.exit(0);
  }

  switch (args.command) {
    case 'monitor':
      await handleMonitorCommand(args.options);
      break;
    case 'status':
      await handleStatusCommand();
      break;
    case 'info':
      await handleInfoCommand();
      break;
    case 'server':
      await handleServerCommand(args.options);
      break;
    case 'alerts':
      handleAlertsCommand(args.options);
      break;
    case 'setup':
      await handleSetupCommand();
      break;
    default:
      console.error(colors.red(`Unknown command: ${args.command}`));
      showHelp('vigilplus');
      process.exit(1);
  }
}

async function handleMonitorCommand(options: Record<string, any>) {
  const config: MonitoringConfig = {
    interval: (options.interval || 2) * 1000, // Convert to milliseconds
    logToFile: options.log || false,
    logPath: options['log-path'] || './monitor.log',
    alerts: [
      {
        metric: 'cpu',
        threshold: parseFloat(options.cpu || '80'),
        operator: '>',
        enabled: true
      },
      {
        metric: 'memory',
        threshold: parseFloat(options.memory || '85'),
        operator: '>',
        enabled: true
      },
      {
        metric: 'disk',
        threshold: parseFloat(options.disk || '90'),
        operator: '>',
        enabled: true
      }
    ]
  };

  const monitor = new SystemMonitor(config);
  const display = new ConsoleDisplay();

  // Event handlers
  monitor.on('started', () => {
    display.displayStartMessage();
  });

  monitor.on('metrics', (metrics) => {
    display.displayMetrics(metrics);
  });

  monitor.on('alert', (alert) => {
    display.displayAlert(alert);
  });

  monitor.on('error', (error) => {
    display.displayError(error);
  });

  monitor.on('stopped', () => {
    display.displayStopMessage();
    process.exit(0);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(colors.yellow('\n🛑 Shutting down VigilPlus...'));
    monitor.stop();
  });

  process.on('SIGTERM', () => {
    monitor.stop();
  });

  // Start monitoring
  try {
    await monitor.start();
  } catch (error) {
    console.error(colors.red('Failed to start monitoring:'), error);
    process.exit(1);
  }
}

async function handleStatusCommand() {
  const config: MonitoringConfig = {
    interval: 1000,
    logToFile: false,
    alerts: []
  };

  const monitor = new SystemMonitor(config);
  const display = new ConsoleDisplay();

  try {
    console.log(colors.cyan('🔍 Collecting system information...\n'));
    
    // Collect metrics once
    monitor.on('metrics', (metrics) => {
      display.displayMetrics(metrics);
      process.exit(0);
    });

    monitor.on('error', (error) => {
      display.displayError(error);
      process.exit(1);
    });

    await monitor.start();
    
    // Stop after collecting one set of metrics
    setTimeout(() => {
      monitor.stop();
    }, 100);

  } catch (error) {
    console.error(colors.red('Failed to get system status:'), error);
    process.exit(1);
  }
}

async function handleServerCommand(options: Record<string, any>) {
  // Load config file if it exists
  let config: any = {};
  try {
    const fs = await import('fs');
    const path = await import('path');
    const configFile = path.join(process.env.HOME || '/tmp', '.vigilplus', 'config.json');
    if (fs.existsSync(configFile)) {
      const configData = fs.readFileSync(configFile, 'utf8');
      config = JSON.parse(configData);
      console.log(colors.green('✅ Using saved configuration from ~/.vigilplus/config.json'));
    }
  } catch (error) {
    // Ignore config file errors, use defaults
  }

  const port = parseInt(options.port || config.server?.port || '8080');
  const host = options.host || config.server?.host || '0.0.0.0';
  const withMonitor = options['with-monitor'] || false;
  
  const monitoringConfig: MonitoringConfig = {
    interval: (options.interval || options['monitor-interval'] || config.server?.interval || 2) * 1000, // Convert to milliseconds
    logToFile: withMonitor && (options['monitor-log'] || false),
    logPath: options['monitor-log'] || './monitor.log',
    alerts: [
      {
        metric: 'cpu',
        threshold: parseFloat(options.cpu || config.alerts?.cpu || '80'),
        operator: '>',
        enabled: true
      },
      {
        metric: 'memory',
        threshold: parseFloat(options.memory || config.alerts?.memory || '85'),
        operator: '>',
        enabled: true
      },
      {
        metric: 'disk',
        threshold: parseFloat(options.disk || config.alerts?.disk || '90'),
        operator: '>',
        enabled: true
      }
    ]
  };

  const monitor = new SystemMonitor(monitoringConfig);
  const apiServer = new ApiServer(monitor, port, host);
  const display = withMonitor ? new ConsoleDisplay() : null;

  // Event handlers
  monitor.on('started', () => {
    if (withMonitor) {
      console.log(colors.green('✅ VigilPlus API Server + Monitor started'));
      display?.displayStartMessage();
    } else {
      console.log(colors.green('✅ VigilPlus API Server started'));
    }
  });

  monitor.on('metrics', (metrics) => {
    if (withMonitor) {
      display?.displayMetrics(metrics);
    } else {
      const timestamp = new Date().toLocaleTimeString();
      console.log(colors.gray(`[${timestamp}] Broadcasting metrics to ${apiServer['connectedClients']?.size || 0} clients`));
    }
  });

  monitor.on('alert', (alert) => {
    if (withMonitor) {
      display?.displayAlert(alert);
    } else {
      console.log(colors.red(`🚨 ALERT: ${alert.metric} is ${alert.value}% (threshold: ${alert.threshold}%)`));
    }
  });

  monitor.on('error', (error) => {
    if (withMonitor) {
      display?.displayError(error);
    } else {
      console.error(colors.red('❌ Monitor error:'), error);
    }
  });

  monitor.on('stopped', () => {
    console.log(colors.yellow('🛑 VigilPlus monitoring stopped'));
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log(colors.yellow('\n🛑 Shutting down VigilPlus server...'));
    
    try {
      monitor.stop();
      await apiServer.stop();
      console.log(colors.green('✅ Server shutdown complete'));
      process.exit(0);
    } catch (error) {
      console.error(colors.red('❌ Error during shutdown:'), error);
      process.exit(1);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    // Start monitoring first
    await monitor.start();
    
    // Then start API server
    await apiServer.start();
    
    console.log(colors.green('\n🎯 VigilPlus Server Ready!'));
    console.log(colors.white(`   Server Host: ${host}`));
    console.log(colors.white(`   Server Port: ${apiServer.getPort()}`));
    console.log(colors.white(`   Health Check: http://${host === '0.0.0.0' ? 'localhost' : host}:${apiServer.getPort()}/health`));
    console.log(colors.white(`   Metrics API: http://${host === '0.0.0.0' ? 'localhost' : host}:${apiServer.getPort()}/api/metrics`));
    console.log(colors.white(`   Real-time Stream: http://${host === '0.0.0.0' ? 'localhost' : host}:${apiServer.getPort()}/api/stream`));
    console.log(colors.gray('\n   Press Ctrl+C to stop the server'));
    
  } catch (error) {
    console.error(colors.red('❌ Failed to start server:'), error);
    process.exit(1);
  }
}

function handleAlertsCommand(options: Record<string, any>) {
  console.log(colors.blue('📋 Alert Configuration'));
  console.log(colors.gray('─'.repeat(30)));
  
  if (options.cpu) {
    console.log(colors.green(`✅ CPU alert threshold set to ${options.cpu}%`));
  }
  if (options.memory) {
    console.log(colors.green(`✅ Memory alert threshold set to ${options.memory}%`));
  }
  if (options.disk) {
    console.log(colors.green(`✅ Disk alert threshold set to ${options.disk}%`));
  }
  if (options.disable) {
    console.log(colors.yellow(`🔕 ${options.disable} alerts disabled`));
  }
  
  console.log(colors.gray('\nNote: Alert configuration persistence will be implemented in future versions.'));
}

async function handleInfoCommand() {
  const si = await import('systeminformation');
  
  try {
    console.log(colors.cyan('💻 System Information'));
    console.log(colors.gray('═'.repeat(50)));
    
    const [system, cpu, mem, os] = await Promise.all([
      si.system(),
      si.cpu(),
      si.mem(),
      si.osInfo()
    ]);

    console.log(colors.bold.blue('System:'));
    console.log(`  Manufacturer: ${colors.white(system.manufacturer || 'Unknown')}`);
    console.log(`  Model:        ${colors.white(system.model || 'Unknown')}`);
    console.log();

    console.log(colors.bold.blue('CPU:'));
    console.log(`  Brand:        ${colors.white(cpu.brand)}`);
    console.log(`  Cores:        ${colors.white(cpu.cores.toString())}`);
    console.log(`  Speed:        ${colors.white(cpu.speed.toString())} GHz`);
    console.log();

    console.log(colors.bold.blue('Memory:'));
    console.log(`  Total:        ${colors.white((mem.total / 1024 / 1024 / 1024).toFixed(2))} GB`);
    console.log();

    console.log(colors.bold.blue('Operating System:'));
    console.log(`  Platform:     ${colors.white(os.platform)}`);
    console.log(`  Distro:       ${colors.white(os.distro)}`);
    console.log(`  Release:      ${colors.white(os.release)}`);
    console.log(`  Architecture: ${colors.white(os.arch)}`);

  } catch (error) {
    console.error(colors.red('Failed to get system information:'), error);
    process.exit(1);
  }
}

async function handleSetupCommand() {
  const fs = await import('fs');
  const path = await import('path');
  const readline = await import('readline');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };

  try {
    console.log(colors.cyan('🛠️  VigilPlus Setup Configuration\n'));
    
    // Ask for port
    const portInput = await question(colors.yellow('Enter preferred server port (default: 8080): '));
    const port = portInput.trim() || '8080';
    
    // Validate port
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      console.log(colors.red('❌ Invalid port number. Using default 8080.'));
    }
    
    // Ask for host
    const hostInput = await question(colors.yellow('Enter server host (default: 0.0.0.0 for all interfaces): '));
    const host = hostInput.trim() || '0.0.0.0';
    
    // Ask for monitoring interval
    const intervalInput = await question(colors.yellow('Enter monitoring interval in seconds (default: 2): '));
    const interval = intervalInput.trim() || '2';
    
    // Ask for alert thresholds
    const cpuInput = await question(colors.yellow('Enter CPU alert threshold % (default: 80): '));
    const cpu = cpuInput.trim() || '80';
    
    const memoryInput = await question(colors.yellow('Enter Memory alert threshold % (default: 85): '));
    const memory = memoryInput.trim() || '85';
    
    const diskInput = await question(colors.yellow('Enter Disk alert threshold % (default: 90): '));
    const disk = diskInput.trim() || '90';
    
    // Create config object
    const config = {
      server: {
        port: parseInt(port) || 8080,
        host: host,
        interval: parseInt(interval) || 2
      },
      alerts: {
        cpu: parseInt(cpu) || 80,
        memory: parseInt(memory) || 85,
        disk: parseInt(disk) || 90
      },
      logging: {
        enabled: true,
        path: '~/vigilplus.log'
      }
    };
    
    // Create config directory
    const configDir = path.join(process.env.HOME || '/tmp', '.vigilplus');
    const configFile = path.join(configDir, 'config.json');
    
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Write config file
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    
    console.log(colors.green('\n✅ Configuration saved successfully!'));
    console.log(colors.cyan(`📁 Config file: ${configFile}`));
    console.log(colors.yellow('\n🚀 Quick start commands:'));
    console.log(colors.white(`   vigilplus server    # Uses your configured settings`));
    console.log(colors.white(`   vigilplus monitor   # Terminal monitoring`));
    console.log(colors.white(`   vigilplus status    # Quick system check`));
    
    console.log(colors.gray('\n💡 You can still override settings with command line options:'));
    console.log(colors.gray(`   vigilplus server --port ${config.server.port} --host ${config.server.host}`));
    
  } catch (error) {
    console.error(colors.red('❌ Setup failed:'), error);
  } finally {
    rl.close();
  }
}

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error(colors.red('Unhandled Rejection at:'), promise, colors.red('reason:'), reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(colors.red('Uncaught Exception:'), error);
  process.exit(1);
});

// Run the CLI
main().catch((error) => {
  console.error(colors.red('CLI Error:'), error);
  process.exit(1);
}); 