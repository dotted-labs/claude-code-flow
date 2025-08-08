import * as fs from 'fs-extra';

const START_SENTINEL = '## DL Agentic Workflow';
const END_SENTINEL = '## DL Agentic Workflow END';

export async function insertOrUpdateSectionBySentinels(
  filePath: string,
  newContent: string
): Promise<{ action: 'created' | 'updated' | 'skipped'; sectionFound: boolean }> {
  const exists = await fs.pathExists(filePath);
  
  if (!exists) {
    const content = `${START_SENTINEL}\n${newContent}\n${END_SENTINEL}\n`;
    await fs.writeFile(filePath, content, 'utf8');
    return { action: 'created', sectionFound: false };
  }

  const existingContent = await fs.readFile(filePath, 'utf8');
  const startIndex = existingContent.indexOf(START_SENTINEL);
  const endIndex = existingContent.indexOf(END_SENTINEL);
  
  if (startIndex === -1) {
    // Section doesn't exist, append to end
    const newSection = `\n${START_SENTINEL}\n${newContent}\n${END_SENTINEL}\n`;
    const updatedContent = existingContent.trimEnd() + newSection;
    await fs.writeFile(filePath, updatedContent, 'utf8');
    return { action: 'updated', sectionFound: false };
  }
  
  if (endIndex === -1) {
    throw new Error(`Found start sentinel "${START_SENTINEL}" but no end sentinel "${END_SENTINEL}" in ${filePath}`);
  }
  
  if (startIndex >= endIndex) {
    throw new Error(`End sentinel "${END_SENTINEL}" appears before start sentinel "${START_SENTINEL}" in ${filePath}`);
  }

  // Extract existing section content
  const startLineEnd = existingContent.indexOf('\n', startIndex);
  const sectionStart = startLineEnd === -1 ? existingContent.length : startLineEnd + 1;
  const existingSectionContent = existingContent.substring(sectionStart, endIndex).trim();
  
  if (existingSectionContent === newContent.trim()) {
    return { action: 'skipped', sectionFound: true };
  }

  // Replace section content
  const beforeSection = existingContent.substring(0, sectionStart);
  const afterSection = existingContent.substring(endIndex);
  const updatedContent = `${beforeSection}${newContent}\n${afterSection}`;
  
  await fs.writeFile(filePath, updatedContent, 'utf8');
  return { action: 'updated', sectionFound: true };
}

export function validateSentinels(content: string): { valid: boolean; error?: string } {
  const startCount = (content.match(new RegExp(START_SENTINEL, 'g')) || []).length;
  const endCount = (content.match(new RegExp(END_SENTINEL, 'g')) || []).length;
  
  if (startCount > 1) {
    return { valid: false, error: `Multiple start sentinels found: ${startCount}` };
  }
  
  if (endCount > 1) {
    return { valid: false, error: `Multiple end sentinels found: ${endCount}` };
  }
  
  if (startCount !== endCount) {
    return { valid: false, error: `Mismatched sentinels: ${startCount} start, ${endCount} end` };
  }
  
  return { valid: true };
}