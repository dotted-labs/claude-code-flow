# claude-code-flow

A CLI tool to initialize DL Agentic Workflow for Claude Code projects.

## Installation & Usage

### Quick Start

```bash
npx claude-code-flow init
```

This command initializes the DL Agentic Workflow in your current project by:
- Copying agent configurations to `.claude/agents`
- Adding workflow commands to `commands/dl`
- Merging MCP server configurations into `mcp.json`
- Updating `CLAUDE.md` with workflow instructions

### Available Commands

#### `init`

Initialize DL Agentic Workflow in your project.

```bash
npx claude-code-flow init [options]
```

**Options:**
- `--cwd <path>` - Target directory (default: current working directory)
- `--dry-run` - Show what would be done without making changes
- `--force` - Overwrite existing files when they differ

**Examples:**

```bash
# Initialize in current directory
npx claude-code-flow init

# Initialize in specific directory
npx claude-code-flow init --cwd /path/to/project

# Preview changes without applying them
npx claude-code-flow init --dry-run

# Force overwrite conflicting files
npx claude-code-flow init --force
```

## What Gets Created/Modified

### 1. Agent Configurations (`.claude/agents/`)
- Copies agent workflow definitions from the package
- Merges with existing agents without overwriting
- Provides specialized Claude Code agents for different tasks

### 2. Workflow Commands (`commands/dl/`)
- Adds DL-specific workflow commands
- Integrates with Claude Code's command system
- Enables enhanced project automation

### 3. MCP Configuration (`mcp.json`)
- Merges MCP server entries required by DL workflow
- Creates `.bak` backup before modifications
- Preserves existing user configurations and formatting
- Only adds missing entries, never removes or modifies existing ones

### 4. Claude Instructions (`CLAUDE.md`)
- Updates the "## DL Agentic Workflow" section
- Creates file if it doesn't exist
- Preserves all other content in the file
- Uses sentinels for precise section replacement

## Idempotency & Safety

**Safe Operations:**
- Running `init` multiple times is safe and won't duplicate content
- Existing files are only modified when content actually differs
- Backups are created before modifying `mcp.json`
- User modifications are preserved unless `--force` is used

**Conflict Resolution:**
- By default, conflicting files are not overwritten
- Use `--force` flag to overwrite when necessary
- Clear logs indicate what actions were taken or skipped

**Cross-Platform Support:**
- Works on Windows, macOS, and Linux
- Handles different path separators automatically
- Preserves line endings (CRLF/LF) as appropriate

## File Structure

After running `init`, your project will have:

```
your-project/
├── .claude/
│   └── agents/
│       └── [agent files from package]
├── commands/
│   └── dl/
│       └── [workflow commands from package]
├── mcp.json (updated with DL MCP servers)
├── mcp.json.bak (backup of original)
└── CLAUDE.md (updated with DL workflow section)
```

## Development

### Building

```bash
npm install
npm run build
```

### Local Testing

```bash
# Build and test locally
npm run build
node dist/cli.js init --dry-run

# Test with npm pack
npm pack
npx ./claude-code-flow-*.tgz init --dry-run
```

### Publishing

```bash
npm run prepublishOnly
npm publish
```

## Troubleshooting

### Common Issues

**Permission Errors:**
- Ensure you have write permissions to the target directory
- On Windows, run as Administrator if needed

**Path Issues:**
- Use absolute paths with `--cwd` flag
- Ensure target directory exists before running

**MCP Conflicts:**
- Review `mcp.json.bak` to see original configuration
- Use `--force` to overwrite conflicting MCP entries

### Error Messages

- **"Target directory does not exist"** - Create the directory or use correct `--cwd` path
- **"Source directory does not exist"** - Package installation may be incomplete
- **"Mismatched sentinels"** - CLAUDE.md has corrupted section markers, fix manually

## License

MIT License - see [LICENSE](./LICENSE) file for details.