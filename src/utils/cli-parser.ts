export interface CLICommand {
  name: string;
  description: string;
  options?: Record<string, any>;
}

export interface ParsedArgs {
  command: string;
  options: Record<string, any>;
  help: boolean;
}

export function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {
    command: 'help',
    options: {},
    help: false
  };

  if (args.length < 3) {
    result.help = true;
    return result;
  }

  const command = args[2];
  
  // Handle help flags
  if (command === '--help' || command === '-h' || command === 'help') {
    result.help = true;
    return result;
  }

  result.command = command;

  // Parse options for each command
  for (let i = 3; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      
      // Handle flags with values
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        const value = args[i + 1];
        result.options[key] = isNaN(Number(value)) ? value : Number(value);
        i++; // Skip next arg as it's the value
      } else {
        // Boolean flag
        result.options[key] = true;
      }
    } else if (arg.startsWith('-')) {
      // Short flags
      const key = arg.slice(1);
      result.options[key] = true;
    }
  }

  return result;
}

export function showHelp(programName: string): void {
  console.log(`${programName} - Advanced server monitoring tool with real-time metrics

Usage: ${programName} [command] [options]

Commands:
  monitor     Start real-time system monitoring with terminal display
  server      Start HTTP API server for remote monitoring and Flutter app integration
  status      Display current system status snapshot
  info        Show detailed system information and hardware specs
  alerts      Configure monitoring alert thresholds

Global Options:
  -h, --help  Show this help message

Monitor Options:
  --interval  Update interval in seconds (default: 2)
  --cpu       CPU alert threshold % (default: 80)
  --memory    Memory alert threshold % (default: 85)
  --disk      Disk alert threshold % (default: 90)
  --log       Enable logging to file
  --log-path  Custom log file path (default: ./monitor.log)

Server Options:
  --port            Server port number (default: 3000)
  --host            Server bind address (default: 0.0.0.0 - all interfaces)
  --interval        Metrics update interval in seconds (default: 2)
  --cpu             CPU alert threshold % (default: 80)
  --memory          Memory alert threshold % (default: 85)
  --disk            Disk alert threshold % (default: 90)
  --with-monitor    Enable terminal monitor display alongside API server
  --monitor-interval Monitor update interval in seconds (default: 2)
  --monitor-log     Log file path for monitor mode (default: ./monitor.log)

Alert Options:
  --cpu       CPU usage alert threshold % (default: 80)
  --memory    Memory usage alert threshold % (default: 85)
  --disk      Disk usage alert threshold % (default: 90)
  --disable   Disable specific alert types (cpu|memory|disk)

Examples:
  ${programName} status
  ${programName} info
  ${programName} monitor --interval 5 --cpu 75
  ${programName} server --port 8080 --host 127.0.0.1
  ${programName} server --port 3001 --interval 1
  ${programName} server --port 8080 --with-monitor --monitor-log /var/log/vigilplus/monitor.log
  ${programName} alerts --cpu 70 --memory 80 --disk 90

Environment Variables:
  NODE_ENV           Set to 'production' for production mode
  ALLOWED_ORIGINS    Comma-separated list of allowed CORS origins
  
Security Notes:
  - Use --host 127.0.0.1 to bind only to localhost
  - Set ALLOWED_ORIGINS to restrict API access
  - Monitor logs for suspicious activity
`);
} 