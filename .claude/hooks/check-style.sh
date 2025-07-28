#!/usr/bin/env bash
# 在 Write/Edit 后自动格式化常见文件类型（需要本地 node / prettier）
set -euo pipefail

payload="$(cat || true)"
file=$(echo "$payload" | jq -r '.tool_input.file_path // .tool_input.path // ""')

if [ -z "$file" ]; then
  files=$(echo "$payload" | jq -r '.tool_input.files[]?.path // empty')
else
  files="$file"
fi

[ -z "${files:-}" ] && exit 0

for f in $files; do
  if [[ "$f" =~ \.(js|mjs|cjs|ts|tsx|jsx|json|css|md|html)$ ]]; then
    if command -v npx >/dev/null 2>&1; then
      npx --yes prettier --write "$f" || true
    fi
  fi
done

exit 0