import { join } from 'node:path';
import { copyDir, pathExists, filesEqual, removeDir } from '../utils/fs.js';
import { getHost } from '../hosts/index.js';
import type { Host, HostId, Scope, Skill } from '../types.js';
import { getSkill } from './registry.js';

export type InstallOutcome = 'installed' | 'skipped-same' | 'skipped-modified' | 'overwritten';

export interface InstallResult {
  skillName: string;
  hostId: HostId;
  outcome: InstallOutcome;
  backupPath?: string;
}

export interface InstallOptions {
  /** 覆盖已修改的 skill（先备份） */
  force?: boolean;
  /** 安装作用域；默认 'global' */
  scope?: Scope;
  /** 项目级安装时的目标项目路径；默认 process.cwd() */
  cwd?: string;
}

/** 按 scope 解析目标 skills 目录。project 时 host 必须支持 projectSkillsDir。 */
function resolveSkillsDir(host: Host, opts: InstallOptions): string {
  if (opts.scope === 'project') {
    if (!host.projectSkillsDir) {
      throw new Error(`宿主 ${host.displayName} 不支持项目级安装`);
    }
    return host.projectSkillsDir(opts.cwd || process.cwd());
  }
  return host.skillsDir;
}

/**
 * 安装单个 skill 到单个宿主。
 */
export function installSkillToHost(skill: Skill, host: Host, opts: InstallOptions = {}): InstallResult {
  const root = resolveSkillsDir(host, opts);
  const dst = join(root, skill.name);
  const dstMd = join(dst, 'SKILL.md');
  const srcMd = join(skill.dir, 'SKILL.md');

  // 目标不存在 → 直接拷贝整个目录
  if (!pathExists(dstMd)) {
    copyDir(skill.dir, dst);
    return { skillName: skill.name, hostId: host.id, outcome: 'installed' };
  }

  // 内容相同 → 跳过
  if (filesEqual(srcMd, dstMd)) {
    return { skillName: skill.name, hostId: host.id, outcome: 'skipped-same' };
  }

  // 内容不同（用户改过）
  if (!opts.force) {
    return { skillName: skill.name, hostId: host.id, outcome: 'skipped-modified' };
  }

  // force 覆盖：先备份再重拷
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${dst}.bak.${ts}`;
  copyDir(dst, backupPath);
  removeDir(dst);
  copyDir(skill.dir, dst);
  return { skillName: skill.name, hostId: host.id, outcome: 'overwritten', backupPath };
}

/**
 * 安装 skill 到多个宿主。
 */
export function installSkill(skillName: string, hostIds: HostId[], opts: InstallOptions = {}): InstallResult[] {
  const skill = getSkill(skillName);
  if (!skill) throw new Error(`未找到内置 skill: ${skillName}`);
  return hostIds.map(id => installSkillToHost(skill, getHost(id), opts));
}

/**
 * 从多个宿主移除 skill。
 */
export function removeSkill(skillName: string, hostIds: HostId[], opts: Pick<InstallOptions, 'scope' | 'cwd'> = {}): { hostId: HostId; removed: boolean }[] {
  return hostIds.map(id => {
    const host = getHost(id);
    const root = resolveSkillsDir(host, opts);
    const dst = join(root, skillName);
    if (!pathExists(dst)) return { hostId: id, removed: false };
    removeDir(dst);
    return { hostId: id, removed: true };
  });
}

/**
 * 更新 skill（强制重装，等同 installSkill + force）。
 */
export function updateSkill(skillName: string, hostIds: HostId[], opts: Pick<InstallOptions, 'scope' | 'cwd'> = {}): InstallResult[] {
  return installSkill(skillName, hostIds, { ...opts, force: true });
}
