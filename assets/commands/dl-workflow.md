# DL Workflow Commands

Sample command definitions for DL Agentic Workflow.

## Available Commands

### `/dl-init`
Initialize DL workflow components in the current project.

**Usage**: `/dl-init [options]`
**Flags**: `--force`, `--dry-run`

### `/dl-agent [name]`
Create or configure a DL agent.

**Usage**: `/dl-agent productivity --type workflow`
**Flags**: `--type [workflow|analysis|automation]`

### `/dl-sync`
Synchronize DL workflow configuration across team.

**Usage**: `/dl-sync`
**Flags**: `--remote [url]`, `--local-only`

## Integration

These commands integrate with Claude Code's native command system and provide enhanced workflow automation capabilities.

This file will be copied to `commands/dl/dl-workflow.md` in the user's project.