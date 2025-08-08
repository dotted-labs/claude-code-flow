export interface McpEntry {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  [key: string]: unknown;
}

export interface McpConfig {
  mcpServers?: Record<string, McpEntry>;
  [key: string]: unknown;
}

export interface InitOptions {
  cwd: string;
  dryRun: boolean;
  force: boolean;
}

export interface CopyResult {
  action: 'created' | 'updated' | 'skipped' | 'conflict';
  path: string;
  reason?: string;
}

export interface InitSummary {
  agentsCopy: CopyResult[];
  commandsCopy: CopyResult[];
  mcpMerge: {
    action: 'created' | 'updated' | 'skipped';
    entriesAdded: number;
    backupCreated: boolean;
  };
  claudeMdUpdate: {
    action: 'created' | 'updated' | 'skipped';
    sectionFound: boolean;
  };
}

export interface FileComparison {
  identical: boolean;
  exists: boolean;
}