# VigilPlus 📊

A powerful, real-time server monitoring tool built with Node.js and TypeScript. Monitor your system's CPU, memory, disk I/O, and network performance with beautiful terminal displays and customizable alerts.

## Features

### Current Capabilities ✅

- **CPU Monitoring**: Real-time CPU usage percentage, core count, speed, and temperature
- **Memory Monitoring**: RAM usage, available memory, swap usage with visual progress bars
- **Disk I/O**: Read/write speeds, disk space usage, and storage metrics
- **Network Traffic**: Download/upload speeds, bytes transferred
- **Real-time Display**: Beautiful terminal interface with colored output and progress bars
- **Alerts System**: Configurable thresholds for CPU, memory, and disk usage
- **Multiple Commands**: Monitor, status check, system info, and alert configuration

### Future Features 🚀

- **Response Time Monitoring**: HTTP/HTTPS endpoint response time tracking
- **Error Rate Tracking**: Monitor application error rates and patterns
- **Application-Specific Metrics**: Database query times, API response times
- **Historical Data Export**: Export monitoring data to JSON/CSV
- **Web Dashboard**: Browser-based monitoring interface
- **Multiple Server Monitoring**: Monitor multiple servers from one dashboard

## Installation

### From NPM (Coming Soon)
```bash
npm install -g vigilplus
```

### Development Setup
```bash
# Clone the repository
git clone <repository-url>
cd vigilplus

# Install dependencies
npm install

# Build the project
npm run build

# Link for global use (optional)
npm link
```

## Usage

### Real-time Monitoring
Start continuous monitoring with default settings:
```bash
vigilplus monitor
```

With custom options:
```bash
# Custom update interval (2 seconds)
monitorplus monitor --interval 2000

# Enable logging with custom path
monitorplus monitor --log --log-path ./system-monitor.log

# Custom alert thresholds
monitorplus monitor --cpu-alert 70 --memory-alert 80 --disk-alert 85
```

### Quick System Status
Get a one-time snapshot of system metrics:
```bash
monitorplus status
```

### System Information
View detailed system information:
```bash
monitorplus info
```

### Alert Configuration
Configure monitoring alerts:
```bash
# Set custom thresholds
monitorplus alerts --cpu 75 --memory 80 --disk 90

# Disable specific metric alerts
monitorplus alerts --disable cpu
```

## Command Line Options

### `monitorplus monitor`
- `-i, --interval <ms>`: Update interval in milliseconds (default: 2000)
- `-l, --log`: Enable logging to file
- `--log-path <path>`: Custom log file path (default: ./monitor.log)
- `--cpu-alert <percentage>`: CPU usage alert threshold (default: 80)
- `--memory-alert <percentage>`: Memory usage alert threshold (default: 85)
- `--disk-alert <percentage>`: Disk usage alert threshold (default: 90)

### `monitorplus status`
Shows current system status once and exits.

### `monitorplus info`
Displays detailed system information including hardware specs.

### `monitorplus alerts`
- `--cpu <threshold>`: Set CPU alert threshold
- `--memory <threshold>`: Set memory alert threshold
- `--disk <threshold>`: Set disk alert threshold
- `--disable <metric>`: Disable alerts for a specific metric

## Programmatic Usage

You can also use MonitorPlus as a library in your Node.js applications:

```typescript
import { SystemMonitor, ConsoleDisplay, defaultConfig } from 'monitorplus';

// Create monitor with custom config
const monitor = new SystemMonitor({
  ...defaultConfig,
  interval: 5000, // 5 seconds
  alerts: [
    {
      metric: 'cpu',
      threshold: 90,
      operator: '>',
      enabled: true
    }
  ]
});

const display = new ConsoleDisplay();

// Set up event handlers
monitor.on('metrics', (metrics) => {
  console.log('CPU Usage:', metrics.cpu.usage + '%');
  console.log('Memory Usage:', metrics.memory.usagePercentage + '%');
});

monitor.on('alert', (alert) => {
  console.log(`ALERT: ${alert.metric} is at ${alert.value}%`);
});

// Start monitoring
monitor.start();

// Stop monitoring after 1 minute
setTimeout(() => {
  monitor.stop();
}, 60000);
```

## System Requirements

- Node.js 14.0.0 or higher
- TypeScript 4.0+ (for development)
- Works on Linux, macOS, and Windows

## Metrics Explained

### CPU Metrics
- **Usage**: Percentage of CPU cores currently being used
- **Cores**: Number of physical CPU cores
- **Speed**: Current CPU frequency in GHz
- **Temperature**: CPU temperature (when available)

### Memory Metrics
- **Usage Percentage**: Percentage of total RAM being used
- **Used/Free/Total**: Memory amounts in bytes
- **Swap**: Virtual memory usage

### Disk Metrics
- **Usage Percentage**: Percentage of disk space used
- **Read/Write Speed**: Current disk I/O speeds in MB/s
- **Space**: Used, free, and total disk space

### Network Metrics
- **Download/Upload Speed**: Current network transfer rates in Mbps
- **Bytes Received/Sent**: Total network traffic since monitoring started

## Display Features

- **Color-coded metrics**: Green (good), yellow (warning), red (critical)
- **Progress bars**: Visual representation of usage percentages
- **Real-time updates**: Automatically refreshes based on interval
- **Clean interface**: Organized sections with icons and formatting

## Keyboard Shortcuts

- `Ctrl+C`: Stop monitoring and exit
- Terminal supports standard scrolling and copy/paste

## Troubleshooting

### Permission Issues
On some systems, you might need elevated permissions to access certain system metrics:
```bash
sudo monitorplus monitor
```

### Missing Dependencies
If you encounter missing dependencies:
```bash
npm install
npm run build
```

### Platform-specific Issues
- **macOS**: Some temperature readings might not be available
- **Windows**: Disk I/O calculations may vary from other tools
- **Linux**: Requires appropriate permissions for hardware access

## Contributing

We welcome contributions! Areas for improvement:

1. **Response Time Monitoring**: Add HTTP endpoint monitoring
2. **Error Rate Tracking**: Implement application error monitoring
3. **Web Interface**: Create a browser-based dashboard
4. **Data Export**: Add CSV/JSON export functionality
5. **Configuration Persistence**: Save settings between sessions

## License

MIT License - see LICENSE file for details.

## Development

### Scripts
- `npm run build`: Compile TypeScript to JavaScript
- `npm run dev`: Run in development mode with ts-node
- `npm run watch`: Watch mode for development
- `npm test`: Run tests (when implemented)

### Project Structure
```
src/
├── types/          # TypeScript type definitions
├── services/       # Core monitoring services
├── display/        # Output formatting and display
├── utils/          # Utility functions
├── cli.ts          # Command-line interface
└── index.ts        # Main library exports
```

---

**MonitorPlus** - Making server monitoring simple and beautiful! 🚀 