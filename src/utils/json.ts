import * as fs from 'fs-extra';
import * as prettier from 'prettier';
import { McpConfig } from '../types';
import { createBackupFile } from './fs';

export async function readJsonWithBackup<T = unknown>(filePath: string): Promise<T | null> {
  try {
    if (await fs.pathExists(filePath)) {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    }
    return null;
  } catch (error) {
    throw new Error(`Failed to read JSON file ${filePath}: ${(error as Error).message}`);
  }
}

export async function writeJsonFormatted(filePath: string, data: unknown): Promise<void> {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const formatted = await prettier.format(jsonString, { 
      parser: 'json',
      tabWidth: 2,
      useTabs: false
    });
    await fs.writeFile(filePath, formatted, 'utf8');
  } catch (error) {
    // Fallback to basic formatting if prettier fails
    const jsonString = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonString, 'utf8');
  }
}

export function deepMergeMcp(userConfig: McpConfig, packageConfig: McpConfig): {
  merged: McpConfig;
  entriesAdded: number;
} {
  const merged: McpConfig = { ...userConfig };
  let entriesAdded = 0;

  if (!merged.mcpServers) {
    merged.mcpServers = {};
  }

  if (packageConfig.mcpServers) {
    for (const [name, entry] of Object.entries(packageConfig.mcpServers)) {
      if (!merged.mcpServers[name]) {
        merged.mcpServers[name] = { ...entry };
        entriesAdded++;
      }
    }
  }

  return { merged, entriesAdded };
}

export async function mergeAndBackupMcp(
  mcpPath: string,
  packageMcpConfig: McpConfig
): Promise<{ action: 'created' | 'updated' | 'skipped'; entriesAdded: number; backupCreated: boolean }> {
  const exists = await fs.pathExists(mcpPath);
  let backupCreated = false;
  
  if (!exists) {
    await writeJsonFormatted(mcpPath, packageMcpConfig);
    const entriesAdded = Object.keys(packageMcpConfig.mcpServers || {}).length;
    return { action: 'created', entriesAdded, backupCreated };
  }

  const userConfig = await readJsonWithBackup<McpConfig>(mcpPath);
  if (!userConfig) {
    await writeJsonFormatted(mcpPath, packageMcpConfig);
    const entriesAdded = Object.keys(packageMcpConfig.mcpServers || {}).length;
    return { action: 'created', entriesAdded, backupCreated };
  }

  const { merged, entriesAdded } = deepMergeMcp(userConfig, packageMcpConfig);
  
  if (entriesAdded === 0) {
    return { action: 'skipped', entriesAdded: 0, backupCreated };
  }

  // Create backup before modifying
  await createBackupFile(mcpPath);
  backupCreated = true;
  
  await writeJsonFormatted(mcpPath, merged);
  return { action: 'updated', entriesAdded, backupCreated };
}