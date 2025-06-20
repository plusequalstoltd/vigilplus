#!/usr/bin/env node

import { parseArgs, showHelp } from './utils/cli-parser';
import { colors } from './utils/colors';
import { SystemMonitor } from './services/SystemMonitor';
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
    case 'alerts':
      handleAlertsCommand(args.options);
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