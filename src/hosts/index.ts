import type { Host, HostId } from '../types.js';
import { claudeHost } from './claude.js';
import { codexHost } from './codex.js';
import { cursorHost } from './cursor.js';
import { zcodeHost } from './zcode.js';
import { traeHost } from './trae.js';

export const allHosts: Host[] = [
  zcodeHost,
  claudeHost,
  codexHost,
  cursorHost,
  traeHost,
];

const hostMap = new Map<HostId, Host>(allHosts.map(h => [h.id, h]));

export function getHost(id: HostId): Host {
  const h = hostMap.get(id);
  if (!h) throw new Error(`未知宿主: ${id}`);
  return h;
}

export function getAvailableHosts(): Host[] {
  return allHosts.filter(h => h.isAvailable());
}
