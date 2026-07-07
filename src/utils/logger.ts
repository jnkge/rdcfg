const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

export const log = {
  ok(msg: string): void {
    console.log(`${GREEN}✓${RESET}`, msg);
  },
  warn(msg: string): void {
    console.log(`${YELLOW}⚠${RESET}`, msg);
  },
  fail(msg: string): void {
    console.log(`${RED}✗${RESET}`, msg);
  },
  info(msg: string): void {
    console.log(`${CYAN}ℹ${RESET}`, msg);
  },
  step(msg: string): void {
    console.log(`\n${BOLD}${msg}${RESET}`);
  },
};
