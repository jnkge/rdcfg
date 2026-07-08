import { Command } from 'commander';
import { runWizard } from './commands/wizard.js';
import { runList } from './commands/list.js';
import { runAdd } from './commands/add.js';
import { runRemove } from './commands/remove.js';
import { runUpdate } from './commands/update.js';
import { runCodegraphStatus, runCodegraphInstall, runCodegraphUninstall } from './commands/codegraph.js';
import { runDoctor } from './commands/doctor.js';
import type { HostId } from './types.js';

const program = new Command();

program
  .name('rdcfg')
  .description('一键安装管理前端 skills 与 codegraph 代码图谱插件')
  .version('0.1.0')
  .action(() => runWizard());

program
  .command('list')
  .description('列出所有可用内置 skills')
  .action(() => runList());

program
  .command('add [skills...]')
  .description('安装指定 skill（省略则交互选择）')
  .option('-H, --hosts <ids>', '目标宿主，逗号分隔（zcode,claude,codex,cursor,trae）')
  .option('-f, --force', '覆盖已修改的 skill')
  .option('-p, --project', '装入当前项目目录（默认装到全局 ~/.xxx/skills）')
  .option('-l, --language <lang>', '按语言过滤（frontend,python,go,php,flutter）')
  .action(async (skills: string[], opts: { hosts?: string; force?: boolean; project?: boolean; language?: string }) => {
    const hostIds = opts.hosts ? opts.hosts.split(',').map(s => s.trim()) as HostId[] : undefined;
    await runAdd(skills, { hosts: hostIds, force: opts.force, scope: opts.project ? 'project' : 'global', language: opts.language });
  });

program
  .command('remove [skills...]')
  .description('卸载指定 skill')
  .option('-H, --hosts <ids>', '目标宿主，逗号分隔')
  .option('-p, --project', '从当前项目目录卸载')
  .action(async (skills: string[], opts: { hosts?: string; project?: boolean }) => {
    const hostIds = opts.hosts ? opts.hosts.split(',').map(s => s.trim()) as HostId[] : undefined;
    await runRemove(skills, { hosts: hostIds, scope: opts.project ? 'project' : 'global' });
  });

program
  .command('update [skills...]')
  .description('更新 skill（默认全部已安装的）')
  .option('-H, --hosts <ids>', '目标宿主，逗号分隔')
  .option('-p, --project', '更新当前项目目录内的 skill')
  .action(async (skills: string[], opts: { hosts?: string; project?: boolean }) => {
    const hostIds = opts.hosts ? opts.hosts.split(',').map(s => s.trim()) as HostId[] : undefined;
    await runUpdate(skills, { hosts: hostIds, scope: opts.project ? 'project' : 'global' });
  });

const cg = program.command('codegraph').description('管理 codegraph 代码图谱插件');
cg.command('status').description('查看 codegraph 安装与连接状态').action(() => runCodegraphStatus());
cg.command('install').description('安装 codegraph 并连接宿主').action(() => runCodegraphInstall());
cg.command('uninstall').description('卸载 codegraph 并清理配置').action(() => runCodegraphUninstall());

program
  .command('doctor')
  .description('环境体检')
  .action(() => runDoctor());

program.parse();
