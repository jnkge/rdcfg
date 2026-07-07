import { describe, it, expect } from 'vitest';
import { parseFrontmatter } from '../../src/skills/registry.js';

describe('parseFrontmatter', () => {
  it('解析标准 frontmatter', () => {
    const text = `---
name: vue-best-practices
description: Vue 3 最佳实践
category: framework
source: https://example.com
---

# Body here
内容`;
    const { data, body } = parseFrontmatter(text);
    expect(data.name).toBe('vue-best-practices');
    expect(data.description).toBe('Vue 3 最佳实践');
    expect(data.category).toBe('framework');
    expect(data.source).toBe('https://example.com');
    expect(body).toContain('# Body here');
  });

  it('无 frontmatter 时 data 为空 body 为原文', () => {
    const text = '# Just a title';
    const { data, body } = parseFrontmatter(text);
    expect(Object.keys(data)).toHaveLength(0);
    expect(body).toBe('# Just a title');
  });

  it('处理带引号的值', () => {
    const { data } = parseFrontmatter('---\nname: "quoted"\n---\n');
    expect(data.name).toBe('quoted');
  });

  it('解析 language 字段', () => {
    const text = `---
name: go-project-layout
description: Go 项目布局
category: design
language: go
source: github.com/golang-standards/project-layout
---

# Body`;
    const { data } = parseFrontmatter(text);
    expect(data.language).toBe('go');
  });
});
