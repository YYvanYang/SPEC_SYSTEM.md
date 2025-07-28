# Claude Code Configuration

This directory contains Claude Code configuration following official best practices.

## Structure

- `settings.json` - Main configuration file with hooks
- `agents/` - Sub-agent definitions (official Claude Code feature)
- `commands/` - Custom slash commands (official Claude Code feature)
- `hooks/` - Custom scripts for pre/post tool execution
  - `protect-paths.py` - Prevents editing of protected files
  - `check-style.sh` - Validates code style after edits

## Official Claude Code Features

All directories and files follow the official Claude Code specification:

- **settings.json**: Core configuration with validated fields only
- **agents/**: Sub-agent definitions with name/description YAML frontmatter
- **commands/**: Slash commands with proper YAML frontmatter and $ARGUMENTS support
- **hooks/**: Hook scripts for PreToolUse and PostToolUse events

## Compliance

This configuration has been validated against official Claude Code documentation and contains only supported features and field names.