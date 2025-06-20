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
  monitor     Start real-time system monitoring
  status      Display current system status
  info        Show detailed system information  
  alerts      Configure alert thresholds

Options:
  --interval  Update interval in seconds (default: 2)
  --cpu       CPU alert threshold % (default: 80)
  --memory    Memory alert threshold % (default: 90)
  --disk      Disk alert threshold % (default: 95)
  --disable   Disable specific alert types
  -h, --help  Show this help message

Examples:
  ${programName} monitor
  ${programName} monitor --interval 5
  ${programName} status
  ${programName} alerts --cpu 75 --memory 85
`);
} 