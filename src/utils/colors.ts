// ANSI escape codes for terminal colors
const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  
  // Basic colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  
  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
} as const;

type ColorName = 'green' | 'yellow' | 'red' | 'blue' | 'cyan' | 'magenta' | 'white' | 'gray';

export const colors = {
  red: (text: string) => `${COLORS.red}${text}${COLORS.reset}`,
  green: (text: string) => `${COLORS.green}${text}${COLORS.reset}`,
  yellow: (text: string) => `${COLORS.yellow}${text}${COLORS.reset}`,
  blue: (text: string) => `${COLORS.blue}${text}${COLORS.reset}`,
  magenta: (text: string) => `${COLORS.magenta}${text}${COLORS.reset}`,
  cyan: (text: string) => `${COLORS.cyan}${text}${COLORS.reset}`,
  white: (text: string) => `${COLORS.white}${text}${COLORS.reset}`,
  gray: (text: string) => `${COLORS.gray}${text}${COLORS.reset}`,
  
  bold: {
    red: (text: string) => `${COLORS.bold}${COLORS.red}${text}${COLORS.reset}`,
    green: (text: string) => `${COLORS.bold}${COLORS.green}${text}${COLORS.reset}`,
    yellow: (text: string) => `${COLORS.bold}${COLORS.yellow}${text}${COLORS.reset}`,
    blue: (text: string) => `${COLORS.bold}${COLORS.blue}${text}${COLORS.reset}`,
    cyan: (text: string) => `${COLORS.bold}${COLORS.cyan}${text}${COLORS.reset}`,
    white: (text: string) => `${COLORS.bold}${COLORS.white}${text}${COLORS.reset}`,
  }
};

export function colorize(text: string, color: ColorName): string {
  switch (color) {
    case 'green': return colors.green(text);
    case 'yellow': return colors.yellow(text);
    case 'red': return colors.red(text);
    case 'blue': return colors.blue(text);
    case 'cyan': return colors.cyan(text);
    case 'magenta': return colors.magenta(text);
    case 'white': return colors.white(text);
    case 'gray': return colors.gray(text);
    default: return colors.white(text);
  }
} 