import * as path from 'path';
import * as fs from 'fs-extra';
import { InitOptions, InitSummary, McpConfig, CopyResult } from '../types';
import { safeCopyMergeDir, ensureDir } from '../utils/fs';
import { mergeAndBackupMcp, readJsonWithBackup } from '../utils/json';
import { insertOrUpdateSectionBySentinels } from '../utils/markdown';

export class InitCommand {
  private options: InitOptions;
  private assetsDir: string;

  constructor(options: InitOptions) {
    this.options = options;
    // Works for both local dev and installed package
    this.assetsDir = path.resolve(__dirname, '../../assets');
  }

  async execute(): Promise<InitSummary> {
    console.log(`Initializing claude-code-flow in: ${this.options.cwd}`);
    
    if (this.options.dryRun) {
      return this.planActions();
    }

    return this.executeActions();
  }

  private async planActions(): Promise<InitSummary> {
    console.log('\n🔍 Planning actions (dry-run mode):');
    
    const agentsDestDir = path.join(this.options.cwd, '.claude', 'agents');
    const commandsDestDir = path.join(this.options.cwd, 'commands', 'dl');
    const mcpPath = path.join(this.options.cwd, 'mcp.json');
    const claudeMdPath = path.join(this.options.cwd, 'CLAUDE.md');

    console.log(`  📁 Would copy agents to: ${agentsDestDir}`);
    console.log(`  📁 Would copy commands to: ${commandsDestDir}`);
    console.log(`  📄 Would merge MCP config: ${mcpPath}`);
    console.log(`  📝 Would update CLAUDE.md: ${claudeMdPath}`);

    // Return placeholder summary for dry-run
    return {
      agentsCopy: [],
      commandsCopy: [],
      mcpMerge: { action: 'skipped', entriesAdded: 0, backupCreated: false },
      claudeMdUpdate: { action: 'skipped', sectionFound: false }
    };
  }

  private async executeActions(): Promise<InitSummary> {
    const summary: InitSummary = {
      agentsCopy: [],
      commandsCopy: [],
      mcpMerge: { action: 'skipped', entriesAdded: 0, backupCreated: false },
      claudeMdUpdate: { action: 'skipped', sectionFound: false }
    };

    try {
      // Step 1: Copy agents directory
      console.log('\n📁 Copying agents directory...');
      summary.agentsCopy = await this.copyAgentsDirectory();

      // Step 2: Copy commands directory
      console.log('\n📁 Copying commands directory...');
      summary.commandsCopy = await this.copyCommandsDirectory();

      // Step 3: Merge MCP configuration
      console.log('\n📄 Merging MCP configuration...');
      summary.mcpMerge = await this.mergeMcpConfig();

      // Step 4: Update CLAUDE.md
      console.log('\n📝 Updating CLAUDE.md...');
      summary.claudeMdUpdate = await this.updateClaudeMd();

      console.log('\n✅ Initialization completed successfully!');
      this.printSummary(summary);

    } catch (error) {
      console.error('\n❌ Initialization failed:', (error as Error).message);
      throw error;
    }

    return summary;
  }

  private async copyAgentsDirectory(): Promise<CopyResult[]> {
    const srcDir = path.join(this.assetsDir, 'agents');
    const destDir = path.join(this.options.cwd, '.claude', 'agents');
    
    if (!(await fs.pathExists(srcDir))) {
      console.log('  ⚠️  No agents directory found in package assets, skipping');
      return [];
    }

    await ensureDir(destDir);
    const results = await safeCopyMergeDir(srcDir, destDir, this.options.force);
    
    this.logCopyResults(results, 'agents');
    return results;
  }

  private async copyCommandsDirectory(): Promise<CopyResult[]> {
    const srcDir = path.join(this.assetsDir, 'commands');
    const destDir = path.join(this.options.cwd, 'commands', 'dl');
    
    if (!(await fs.pathExists(srcDir))) {
      console.log('  ⚠️  No commands directory found in package assets, skipping');
      return [];
    }

    await ensureDir(destDir);
    const results = await safeCopyMergeDir(srcDir, destDir, this.options.force);
    
    this.logCopyResults(results, 'commands');
    return results;
  }

  private async mergeMcpConfig(): Promise<{ action: 'created' | 'updated' | 'skipped'; entriesAdded: number; backupCreated: boolean }> {
    const packageMcpPath = path.join(this.assetsDir, 'mcp.json');
    const userMcpPath = path.join(this.options.cwd, 'mcp.json');

    if (!(await fs.pathExists(packageMcpPath))) {
      console.log('  ⚠️  No mcp.json found in package assets, skipping');
      return { action: 'skipped', entriesAdded: 0, backupCreated: false };
    }

    const packageMcpConfig = await readJsonWithBackup<McpConfig>(packageMcpPath);
    if (!packageMcpConfig) {
      console.log('  ⚠️  Could not read package mcp.json, skipping');
      return { action: 'skipped', entriesAdded: 0, backupCreated: false };
    }

    const result = await mergeAndBackupMcp(userMcpPath, packageMcpConfig);
    
    if (result.action === 'created') {
      console.log(`  ✅ Created mcp.json with ${result.entriesAdded} entries`);
    } else if (result.action === 'updated') {
      console.log(`  ✅ Updated mcp.json, added ${result.entriesAdded} new entries`);
      if (result.backupCreated) {
        console.log('  💾 Backup created: mcp.json.bak');
      }
    } else {
      console.log('  ⏭️  MCP config unchanged (all entries already present)');
    }

    return result;
  }

  private async updateClaudeMd(): Promise<{ action: 'created' | 'updated' | 'skipped'; sectionFound: boolean }> {
    const promptPath = path.join(this.assetsDir, 'PROMPT.md');
    const claudeMdPath = path.join(this.options.cwd, 'CLAUDE.md');

    if (!(await fs.pathExists(promptPath))) {
      console.log('  ⚠️  No PROMPT.md found in package assets, skipping');
      return { action: 'skipped', sectionFound: false };
    }

    const promptContent = await fs.readFile(promptPath, 'utf8');
    const result = await insertOrUpdateSectionBySentinels(claudeMdPath, promptContent.trim());
    
    if (result.action === 'created') {
      console.log('  ✅ Created CLAUDE.md with DL Agentic Workflow section');
    } else if (result.action === 'updated') {
      if (result.sectionFound) {
        console.log('  ✅ Updated DL Agentic Workflow section in CLAUDE.md');
      } else {
        console.log('  ✅ Added DL Agentic Workflow section to CLAUDE.md');
      }
    } else {
      console.log('  ⏭️  CLAUDE.md section unchanged');
    }

    return result;
  }

  private logCopyResults(results: CopyResult[], type: string): void {
    const created = results.filter(r => r.action === 'created');
    const updated = results.filter(r => r.action === 'updated');
    const skipped = results.filter(r => r.action === 'skipped');
    const conflicts = results.filter(r => r.action === 'conflict');

    if (created.length > 0) {
      console.log(`  ✅ Created ${created.length} ${type} files`);
    }
    if (updated.length > 0) {
      console.log(`  ✅ Updated ${updated.length} ${type} files`);
    }
    if (skipped.length > 0) {
      console.log(`  ⏭️  Skipped ${skipped.length} ${type} files (identical)`);
    }
    if (conflicts.length > 0) {
      console.log(`  ⚠️  ${conflicts.length} ${type} file conflicts (use --force to overwrite):`);
      conflicts.forEach(c => console.log(`    - ${path.relative(this.options.cwd, c.path)}`));
    }
  }

  private printSummary(summary: InitSummary): void {
    console.log('\n📊 Summary:');
    
    const totalFiles = summary.agentsCopy.length + summary.commandsCopy.length;
    if (totalFiles > 0) {
      console.log(`  📁 Files processed: ${totalFiles}`);
    }
    
    if (summary.mcpMerge.entriesAdded > 0) {
      console.log(`  📄 MCP entries added: ${summary.mcpMerge.entriesAdded}`);
    }
    
    if (summary.claudeMdUpdate.action !== 'skipped') {
      console.log(`  📝 CLAUDE.md ${summary.claudeMdUpdate.action}`);
    }
  }
}