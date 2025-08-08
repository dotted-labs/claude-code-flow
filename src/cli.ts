#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import { InitCommand } from './commands/init';
import { InitOptions } from './types';

const program = new Command();

program
  .name('claude-code-flow')
  .description('Initialize DL Agentic Workflow for Claude Code')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize DL Agentic Workflow in the current project')
  .option('--cwd <path>', 'Target directory (default: current working directory)', process.cwd())
  .option('--dry-run', 'Show what would be done without making changes', false)
  .option('--force', 'Overwrite existing files when they differ', false)
  .action(async (options) => {
    try {
      const resolvedCwd = path.resolve(options.cwd);
      
      // Validate target directory exists
      const fs = await import('fs-extra');
      if (!(await fs.pathExists(resolvedCwd))) {
        console.error(`❌ Target directory does not exist: ${resolvedCwd}`);
        process.exit(1);
      }

      const initOptions: InitOptions = {
        cwd: resolvedCwd,
        dryRun: options.dryRun || false,
        force: options.force || false
      };

      const initCommand = new InitCommand(initOptions);
      await initCommand.execute();
      
    } catch (error) {
      console.error('❌ Command failed:', (error as Error).message);
      process.exit(1);
    }
  });

// Handle case where no command is provided
program.action(() => {
  console.log('Use "claude-code-flow init" to initialize DL Agentic Workflow');
  console.log('Run "claude-code-flow --help" for more information');
});

// Error handling for unknown commands
program.on('command:*', () => {
  console.error('❌ Invalid command: %s', program.args.join(' '));
  console.log('Available commands:');
  console.log('  init    Initialize DL Agentic Workflow');
  process.exit(1);
});

program.parse(process.argv);

// If no arguments provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}