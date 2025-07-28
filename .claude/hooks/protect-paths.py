#!/usr/bin/env python3
"""
Protect sensitive paths from accidental modifications
"""
import sys
import json
import os
from pathlib import Path

def main():
    # Read the tool call from stdin
    tool_call = json.loads(sys.stdin.read())
    
    protected_paths = [
        '.claude/settings.json',
        '.claude/workflows/',
        '.claude/hooks/',
        'scripts/',
        'analytics/dashboards/'
    ]
    
    file_path = tool_call.get('parameters', {}).get('file_path', '')
    
    # Check if the file path matches any protected path
    for protected in protected_paths:
        if protected in file_path:
            # Allow read operations, block write operations
            if tool_call['name'] in ['Edit', 'MultiEdit', 'Write']:
                print(f"❌ BLOCKED: Attempt to modify protected path: {file_path}")
                print(f"📋 Protected paths require explicit approval for modifications")
                print(f"💡 Use /review-architecture-change to propose modifications")
                sys.exit(1)
    
    # Allow the operation
    print(f"✅ APPROVED: Operation on {file_path}")
    sys.exit(0)

if __name__ == "__main__":
    main()