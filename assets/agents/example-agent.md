# Example DL Agent

This is a sample agent file to demonstrate the directory structure.

## Purpose
Agents in the `.claude/agents` directory provide specialized workflows and automation for Claude Code.

## Usage
1. Agents are automatically discovered by Claude Code
2. Use specific agent patterns for domain-specific tasks
3. Customize agents based on your project needs

## Configuration
```yaml
name: example-agent
type: workflow
domain: general
triggers:
  - keyword: example
  - pattern: /example/
```

This file will be copied to `.claude/agents/example-agent.md` in the user's project.