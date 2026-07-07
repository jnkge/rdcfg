import * as p from '@clack/prompts';
import type { Skill, Host, HostId } from '../types.js';

export { p };

export function intro(): void {
  p.intro('rdcfg — 前端 skills 与 codegraph 一键安装');
}

export function outro(msg: string): void {
  p.outro(msg);
}

export function cancel(msg: string): never {
  p.cancel(msg);
  process.exit(0);
}

/** 多选要安装的 skills */
export async function selectSkills(skills: Skill[]): Promise<string[] | null> {
  if (skills.length === 0) {
    p.log.warn('未找到内置 skills');
    return [];
  }
  const selected = await p.multiselect({
    message: '选择要安装的 skills',
    options: skills.map(s => ({
      value: s.name,
      label: `${s.name} — ${s.description}`,
      hint: s.category,
    })),
    required: false,
  });
  if (p.isCancel(selected)) return null;
  return selected as string[];
}

/** 多选目标宿主 */
export async function selectHosts(hosts: Host[], defaultIds: HostId[] = []): Promise<HostId[] | null> {
  const selected = await p.multiselect({
    message: '选择目标宿主',
    options: hosts.map(h => ({
      value: h.id,
      label: h.displayName,
      hint: h.isAvailable() ? '已检测到' : '未检测到',
    })),
    initialValues: defaultIds,
    required: true,
  });
  if (p.isCancel(selected)) return null;
  return selected as HostId[];
}

export async function confirmCodegraph(): Promise<boolean | null> {
  const ans = await p.confirm({
    message: '是否同时安装/连接 codegraph 代码图谱？',
    initialValue: true,
  });
  if (p.isCancel(ans)) return null;
  return ans;
}

export async function confirmInitProject(): Promise<boolean | null> {
  const ans = await p.confirm({
    message: '是否在当前项目初始化 codegraph（生成 .codegraph/）？',
    initialValue: true,
  });
  if (p.isCancel(ans)) return null;
  return ans;
}
