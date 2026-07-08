#!/usr/bin/env node
/**
 * rdcfg 发布脚本 —— 一条命令完成：test → build → version bump → publish
 *
 * 用法：
 *   npm run release            # 默认 patch（0.5.0 → 0.5.1）
 *   npm run release -- minor   # minor（0.5.0 → 0.6.0）
 *   npm run release -- major   # major（0.5.0 → 1.0.0）
 *   npm run release -- 1.2.3   # 指定具体版本
 *
 * 流程：
 *   1. 检查工作树干净（避免误提交脏代码）
 *   2. 跑全量测试（必须全绿）
 *   3. build（tsup 打包）
 *   4. npm version <bump>（自动改 package.json + git commit + git tag）
 *   5. npm publish（发布到 npm registry）
 *
 * 任一步失败立即中止，不会产生半成品发布。
 */
import { execSync } from 'node:child_process';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function run(cmd, { ignoreExit = false } = {}) {
  console.log(`${CYAN}▶ ${cmd}${RESET}`);
  execSync(cmd, { stdio: 'inherit' });
  console.log('');
}

function fail(msg) {
  console.error(`${RED}✗ ${msg}${RESET}`);
  process.exit(1);
}

// ── 解析参数 ────────────────────────────────────────────
const bump = process.argv[2] || 'patch';
const validBumps = ['patch', 'minor', 'major'];
if (!validBumps.includes(bump) && !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(bump)) {
  fail(`无效的版本参数：${bump}\n用法: npm run release -- [patch|minor|major|<具体版本号>]`);
}

// ── 1. 检查工作树干净 ──────────────────────────────────
console.log(`${BOLD}1/5  检查工作树...${RESET}`);
let status;
try {
  status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
} catch {
  fail('无法执行 git 命令，确认当前目录是 git 仓库');
}
if (status) {
  fail('工作树不干净，请先 commit 或 stash 未提交的改动');
}
console.log(`${GREEN}✓ 工作树干净${RESET}\n`);

// ── 2. 跑测试 ──────────────────────────────────────────
console.log(`${BOLD}2/5  运行测试...${RESET}`);
try {
  run('npm test');
} catch {
  fail('测试未通过，发布中止');
}

// ── 3. 构建 ────────────────────────────────────────────
console.log(`${BOLD}3/5  构建...${RESET}`);
try {
  run('npm run build');
} catch {
  fail('构建失败，发布中止');
}

// ── 4. 版本号 bump + commit + tag ─────────────────────
console.log(`${BOLD}4/5  更新版本号 (${bump})...${RESET}`);
try {
  run(`npm version ${bump} --no-commit-hooks`);
} catch {
  fail('npm version 失败，发布中止');
}

// ── 5. 发布到 npm ──────────────────────────────────────
console.log(`${BOLD}5/5  发布到 npm...${RESET}`);
try {
  run('npm publish');
} catch {
  fail('npm publish 失败！版本号已 bump 但未发布，请手动检查后执行 npm publish');
}

// ── 提示推送 ───────────────────────────────────────────
console.log(`${GREEN}${BOLD}✓ 发布完成！${RESET}`);
console.log(`\n别忘了推送 commit 和 tag 到远程：`);
console.log(`  ${CYAN}git push && git push --tags${RESET}\n`);
