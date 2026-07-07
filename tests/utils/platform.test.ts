import { describe, it, expect } from 'vitest';
import { home, isWindows } from '../../src/utils/platform.js';

describe('platform', () => {
  it('home 返回非空字符串', () => {
    expect(typeof home()).toBe('string');
    expect(home().length).toBeGreaterThan(0);
  });
  it('isWindows 返回布尔', () => {
    expect(typeof isWindows()).toBe('boolean');
  });
});
