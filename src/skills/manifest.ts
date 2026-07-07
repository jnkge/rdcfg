import { join } from 'node:path';
import { home } from '../utils/platform.js';
import { pathExists, readFileText, atomicWriteFile, ensureDir } from '../utils/fs.js';
import type { Manifest, HostId, Scope } from '../types.js';

export function manifestPath(): string {
  return join(home(), '.rdcfg', 'manifest.json');
}

/** 项目级清单路径：<cwd>/.rdcfg/manifest.json，可 commit 到 git 与团队共享。 */
export function projectManifestPath(cwd: string): string {
  return join(cwd, '.rdcfg', 'manifest.json');
}

/** Manifest 操作作用域选项。global=家目录；project=指定 cwd（默认 process.cwd()）。 */
export interface ManifestScope {
  scope?: Scope;
  cwd?: string;
}

export function emptyManifest(): Manifest {
  return {
    version: 1,
    installedAt: new Date().toISOString(),
    skills: [],
    codegraph: { cliInstalled: false, connectedHosts: [] },
  };
}

export function loadManifest(opts: ManifestScope = {}): Manifest {
  const p = resolveManifestPath(opts);
  if (!pathExists(p)) return emptyManifest();
  try {
    return JSON.parse(readFileText(p)) as Manifest;
  } catch {
    return emptyManifest();
  }
}

export function saveManifest(m: Manifest, opts: ManifestScope = {}): void {
  const p = resolveManifestPath(opts);
  ensureDir(join(p, '..'));
  atomicWriteFile(p, JSON.stringify(m, null, 2));
}

/** 按 scope 解析清单路径：project → <cwd>/.rdcfg/manifest.json；否则 → ~/.rdcfg/manifest.json */
function resolveManifestPath(opts: ManifestScope): string {
  if (opts.scope === 'project') {
    return projectManifestPath(opts.cwd || process.cwd());
  }
  return manifestPath();
}

/** 记录 skill 装到了哪些宿主（合并，不覆盖已记录的其他宿主） */
export function recordSkillInstall(name: string, hosts: HostId[], opts: ManifestScope = {}): void {
  const m = loadManifest(opts);
  let entry = m.skills.find(s => s.name === name);
  if (!entry) {
    entry = { name, hosts: [], installedAt: new Date().toISOString() };
    m.skills.push(entry);
  }
  // 切换 scope 时更新作用域信息
  entry.scope = opts.scope || 'global';
  entry.projectPath = opts.scope === 'project' ? (opts.cwd || process.cwd()) : undefined;
  for (const h of hosts) {
    if (!entry.hosts.includes(h)) entry.hosts.push(h);
  }
  saveManifest(m, opts);
}

/** 记录 codegraph CLI 安装状态 */
export function recordCodegraphCli(installed: boolean): void {
  const m = loadManifest();
  m.codegraph.cliInstalled = installed;
  saveManifest(m);
}

/** 记录 codegraph 连接的宿主（合并） */
export function recordCodegraphConnect(hosts: HostId[]): void {
  const m = loadManifest();
  for (const h of hosts) {
    if (!m.codegraph.connectedHosts.includes(h)) m.codegraph.connectedHosts.push(h);
  }
  saveManifest(m);
}

/** 记录 codegraph 解除连接 */
export function recordCodegraphDisconnect(hosts: HostId[]): void {
  const m = loadManifest();
  m.codegraph.connectedHosts = m.codegraph.connectedHosts.filter(h => !hosts.includes(h));
  saveManifest(m);
}

/** 移除 skill 记录 */
export function removeSkillRecord(name: string, opts: ManifestScope = {}): void {
  const m = loadManifest(opts);
  m.skills = m.skills.filter(s => s.name !== name);
  saveManifest(m, opts);
}

export function getSkillEntry(name: string, opts: ManifestScope = {}): { name: string; hosts: HostId[]; installedAt: string; scope?: Scope; projectPath?: string } | undefined {
  return loadManifest(opts).skills.find(s => s.name === name);
}
