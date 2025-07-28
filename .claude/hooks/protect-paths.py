#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
阻止对子项目敏感文件的自动写入/编辑。
非 0 退出码将阻止本次工具调用（Claude Code 会给出反馈）。
"""
import json, sys

payload = sys.stdin.read()
try:
    data = json.loads(payload or "{}")
except Exception:
    print("protect-paths: invalid JSON payload")
    sys.exit(2)

ti = data.get("tool_input") or {}
file_path = ti.get("file_path") or ti.get("path") or ""
files = ti.get("files") or []
if isinstance(files, str):
    files = [files]

candidates = set()
if file_path:
    candidates.add(file_path)
for f in files:
    if isinstance(f, dict):
        p = f.get("path") or f.get("file_path") or ""
        if p:
            candidates.add(p)
    elif isinstance(f, str):
        candidates.add(f)

forbidden_subpaths = [
    ".env",
    ".git/",
    ".github/workflows/",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml"
]

hit = []
for p in candidates:
    for forb in forbidden_subpaths:
        if forb in p:
            hit.append(p)
            break

if hit:
    print("❌ Protected paths (edit/write blocked):")
    for p in hit:
        print(" -", p)
    sys.exit(2)

sys.exit(0)