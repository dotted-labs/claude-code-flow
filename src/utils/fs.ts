import * as fs from 'fs-extra';
import * as path from 'path';
import { createHash } from 'crypto';
import { CopyResult, FileComparison } from '../types';

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

export async function compareFiles(filePath1: string, filePath2: string): Promise<FileComparison> {
  try {
    const exists1 = await fs.pathExists(filePath1);
    const exists2 = await fs.pathExists(filePath2);
    
    if (!exists1 || !exists2) {
      return { identical: false, exists: exists1 && exists2 };
    }

    const content1 = await fs.readFile(filePath1, 'utf8');
    const content2 = await fs.readFile(filePath2, 'utf8');
    
    return { 
      identical: content1 === content2, 
      exists: true 
    };
  } catch (error) {
    return { identical: false, exists: false };
  }
}

export function getFileChecksum(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

export async function writeFileIfChanged(
  filePath: string, 
  content: string, 
  force: boolean = false
): Promise<CopyResult> {
  const exists = await fs.pathExists(filePath);
  
  if (!exists) {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf8');
    return { action: 'created', path: filePath };
  }

  const existingContent = await fs.readFile(filePath, 'utf8');
  
  if (existingContent === content) {
    return { action: 'skipped', path: filePath, reason: 'identical content' };
  }

  if (!force) {
    return { 
      action: 'conflict', 
      path: filePath, 
      reason: 'file exists with different content, use --force to overwrite' 
    };
  }

  await fs.writeFile(filePath, content, 'utf8');
  return { action: 'updated', path: filePath };
}

export async function safeCopyMergeDir(
  srcDir: string,
  destDir: string,
  force: boolean = false
): Promise<CopyResult[]> {
  const results: CopyResult[] = [];
  
  if (!(await fs.pathExists(srcDir))) {
    throw new Error(`Source directory does not exist: ${srcDir}`);
  }

  await ensureDir(destDir);
  
  const items = await fs.readdir(srcDir);
  
  for (const item of items) {
    const srcPath = path.join(srcDir, item);
    const destPath = path.join(destDir, item);
    const stat = await fs.stat(srcPath);
    
    if (stat.isDirectory()) {
      const subResults = await safeCopyMergeDir(srcPath, destPath, force);
      results.push(...subResults);
    } else {
      const content = await fs.readFile(srcPath, 'utf8');
      const result = await writeFileIfChanged(destPath, content, force);
      results.push(result);
    }
  }
  
  return results;
}

export async function createBackupFile(filePath: string): Promise<string> {
  if (!(await fs.pathExists(filePath))) {
    throw new Error(`Cannot backup non-existent file: ${filePath}`);
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.${timestamp}.bak`;
  
  await fs.copy(filePath, backupPath);
  return backupPath;
}