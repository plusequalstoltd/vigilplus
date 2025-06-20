import { colors, colorize } from '../utils/colors';
import { SystemMetrics } from '../types';
import {
  formatBytes,
  formatPercentage,
  formatSpeed,
  formatTimestamp,
  getColorForPercentage,
  createProgressBar
} from '../utils/formatters';

export class ConsoleDisplay {
  private lastDisplayTime: Date = new Date();

  private colorText(text: string, colorName: string): string {
    switch (colorName) {
      case 'green': return colors.green(text);
      case 'yellow': return colors.yellow(text);
      case 'red': return colors.red(text);
      case 'blue': return colors.blue(text);
      case 'cyan': return colors.cyan(text);
      case 'magenta': return colors.magenta(text);
      case 'white': return colors.white(text);
      default: return colors.white(text);
    }
  }

  displayMetrics(metrics: SystemMetrics): void {
    // Clear screen
    console.clear();
    
    // Header
    this.displayHeader();
    
    // System metrics
    this.displayCPUMetrics(metrics.cpu);
    this.displayMemoryMetrics(metrics.memory);
    this.displayDiskMetrics(metrics.disk);
    this.displayNetworkMetrics(metrics.network);
    
    // Footer
    this.displayFooter(metrics.timestamp);
    
    this.lastDisplayTime = new Date();
  }

  private displayHeader(): void {
    const title = colors.bold.cyan('📊 VigilPlus - System Monitor');
    const border = colors.gray('═'.repeat(60));
    
    console.log(border);
    console.log(title.padStart(40));
    console.log(border);
    console.log();
  }

  private displayCPUMetrics(cpu: any): void {
    const cpuColorName = getColorForPercentage(cpu.usage);
    const progressBar = createProgressBar(cpu.usage, 30);
    
    console.log(colors.bold.blue('🔧 CPU Information'));
    console.log(colors.gray('─'.repeat(40)));
    console.log(`Usage:      ${this.colorText(formatPercentage(cpu.usage), cpuColorName)} ${progressBar}`);
    console.log(`Cores:      ${colors.white(cpu.cores.toString())}`);
    console.log(`Speed:      ${colors.white(cpu.speed.toString())} GHz`);
    if (cpu.temperature) {
      const tempColorName = cpu.temperature > 80 ? 'red' : cpu.temperature > 60 ? 'yellow' : 'green';
      console.log(`Temp:       ${this.colorText(cpu.temperature.toString(), tempColorName)}°C`);
    }
    console.log();
  }

  private displayMemoryMetrics(memory: any): void {
    const memoryColorName = getColorForPercentage(memory.usagePercentage);
    const progressBar = createProgressBar(memory.usagePercentage, 30);
    
    console.log(colors.bold.green('💾 Memory Information'));
    console.log(colors.gray('─'.repeat(40)));
    console.log(`Usage:      ${this.colorText(formatPercentage(memory.usagePercentage), memoryColorName)} ${progressBar}`);
    console.log(`Used:       ${colors.white(formatBytes(memory.used))}`);
    console.log(`Free:       ${colors.white(formatBytes(memory.free))}`);
    console.log(`Total:      ${colors.white(formatBytes(memory.total))}`);
    if (memory.swapUsed > 0) {
      console.log(`Swap:       ${colors.yellow(formatBytes(memory.swapUsed))} / ${formatBytes(memory.swapTotal)}`);
    }
    console.log();
  }

  private displayDiskMetrics(disk: any): void {
    const diskColorName = getColorForPercentage(disk.usagePercentage);
    const progressBar = createProgressBar(disk.usagePercentage, 30);
    
    console.log(colors.bold.yellow('💽 Disk Information'));
    console.log(colors.gray('─'.repeat(40)));
    console.log(`Usage:      ${this.colorText(formatPercentage(disk.usagePercentage), diskColorName)} ${progressBar}`);
    console.log(`Used:       ${colors.white(formatBytes(disk.usedSpace))}`);
    console.log(`Free:       ${colors.white(formatBytes(disk.freeSpace))}`);
    console.log(`Total:      ${colors.white(formatBytes(disk.totalSpace))}`);
    console.log(`Read:       ${colors.cyan(formatSpeed(disk.readSpeed))}`);
    console.log(`Write:      ${colors.magenta(formatSpeed(disk.writeSpeed))}`);
    console.log();
  }

  private displayNetworkMetrics(network: any): void {
    console.log(colors.bold.cyan('🌐 Network Information'));
    console.log(colors.gray('─'.repeat(40)));
    console.log(`Download:   ${colors.green(formatSpeed(network.downloadSpeed, 'Mbps'))}`);
    console.log(`Upload:     ${colors.blue(formatSpeed(network.uploadSpeed, 'Mbps'))}`);
    console.log(`Received:   ${colors.white(formatBytes(network.bytesReceived))}`);
    console.log(`Sent:       ${colors.white(formatBytes(network.bytesSent))}`);
    console.log();
  }

  private displayFooter(timestamp: Date): void {
    const border = colors.gray('═'.repeat(60));
    const updateTime = colors.gray(`Last Update: ${formatTimestamp(timestamp)}`);
    const instructions = colors.gray('Press Ctrl+C to exit');
    
    console.log(border);
    console.log(updateTime);
    console.log(instructions);
  }

  displayAlert(alert: any): void {
    const alertIcon = '🚨';
    const message = `${alertIcon} ALERT: ${alert.metric.toUpperCase()} is ${alert.value.toFixed(2)}% (threshold: ${alert.threshold}%)`;
    console.log(colors.bold.red(message));
  }

  displayError(error: Error): void {
    console.error(colors.bold.red('❌ Error:'), error.message);
  }

  displayStartMessage(): void {
    console.log(colors.green('✅ VigilPlus started successfully!'));
    console.log(colors.gray('Collecting system metrics...'));
    console.log();
  }

  displayStopMessage(): void {
    console.log();
    console.log(colors.yellow('⏹️  VigilPlus stopped.'));
  }
} 