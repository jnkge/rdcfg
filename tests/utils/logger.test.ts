import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { log } from '../../src/utils/logger.js';

describe('logger', () => {
  let spy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => { spy = vi.spyOn(console, 'log').mockImplementation(() => {}); });
  afterEach(() => { spy.mockRestore(); });

  it('ok 输出含 ✓', () => {
    log.ok('done');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('✓'), 'done');
  });
  it('warn 输出含 ⚠', () => {
    log.warn('careful');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('⚠'), 'careful');
  });
  it('fail 输出含 ✗', () => {
    log.fail('broken');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('✗'), 'broken');
  });
});
