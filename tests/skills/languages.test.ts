import { describe, it, expect } from 'vitest';
import { LANGUAGES, LANGUAGE_LABELS, listLanguages } from '../../src/skills/languages.js';

describe('languages', () => {
  it('LANGUAGES 包含 5 种且顺序固定', () => {
    expect(LANGUAGES).toEqual(['frontend', 'python', 'go', 'php', 'flutter']);
  });

  it('LANGUAGE_LABELS 覆盖所有 language', () => {
    for (const id of LANGUAGES) {
      expect(LANGUAGE_LABELS[id]).toBeTruthy();
    }
  });

  it('listLanguages 返回每个语言含计数', () => {
    const list = listLanguages();
    expect(list).toHaveLength(5);
    expect(list.map(x => x.id)).toEqual(['frontend', 'python', 'go', 'php', 'flutter']);
    const fe = list.find(x => x.id === 'frontend')!;
    expect(fe.count).toBeGreaterThanOrEqual(3);
    for (const x of list) expect(x.label).toBeTruthy();
  });
});
