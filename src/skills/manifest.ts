import { join } from 'node:path';
import { home } from '../utils/platform.js';
import { pathExists, readFileText, atomicWriteFile, ensureDir } from '../utils/fs.js';
import type { Manifest, HostId } from '../types.js';

export function manifestPath(): string {
  return join(home(), '.rdcfg', 'manifest.json');
}

export function emptyManifest(): Manifest {
  return {
    version: 1,
    installedAt: new Date().toISOString(),
    skills: [],
    codegraph: { cliInstalled: false, connectedHosts: [] },
  };
}

export function loadManifest(): Manifest {
  const p = manifestPath();
  if (!pathExists(p)) return emptyManifest();
  try {
    return JSON.parse(readFileText(p)) as Manifest;
  } catch {
    return emptyManifest();
  }
}

export function saveManifest(m: Manifest): void {
  ensureDir(join(home(), '.rdcfg'));
  atomicWriteFile(manifestPath(), JSON.stringify(m, null, 2));
}

/** 记录 skill 装到了哪些宿主（合并，不覆盖已记录的其他宿主） */
export function recordSkillInstall(name: string, hosts: HostId[]): void {
  const m = loadManifest();
  let entry = m.skills.find(s => s.name === name);
  if (!entry) {
    entry = { name, hosts: [], installedAt: new Date().toISOString() };
    m.skills.push(entry);
  }
  for (const h of hosts) {
    if (!entry.hosts.includes(h)) entry.hosts.push(h);
  }
  saveManifest(m);
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
export function removeSkillRecord(name: string): void {
  const m = loadManifest();
  m.skills = m.skills.filter(s => s.name !== name);
  saveManifest(m);
}

export function getSkillEntry(name: string): { name: string; hosts: HostId[]; installedAt: string } | undefined {
  return loadManifest().skills.find(s => s.name === name);
}
