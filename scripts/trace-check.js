#!/usr/bin/env node
/**
 * 校验 PR 变更是否引用 R-*；允许 "TRACE-EXCEPTION:" 豁免。
 */
import { execSync } from 'node:child_process';
const sh = (c) => execSync(c, { stdio: ['ignore','pipe','pipe'] }).toString();

const base = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'HEAD~1';
const head = process.env.GITHUB_SHA || 'HEAD';

const changed = sh(`git diff --name-only ${base} ${head}`)
  .trim().split('\n')
  .filter(f => f && !f.startsWith('specs/') && !f.startsWith('.claude/') && !f.startsWith('.github/'));

if (changed.length === 0) { console.log('No relevant files changed. Skipping trace check.'); process.exit(0); }

const diff = sh(`git diff -U0 ${base} ${head}`);
const commits = sh(`git log --format=%B ${base}..${head}`);

const ok = /R-\d+/.test(diff) || /R-\d+/.test(commits) || /TRACE-EXCEPTION:/i.test(diff) || /TRACE-EXCEPTION:/i.test(commits);
if (!ok) {
  console.error('❌ Trace Check failed: No "R-*" found in diff/commits.\nAdd "Trace: R-1" in code/tests/commit or "TRACE-EXCEPTION: reason".');
  process.exit(1);
}
console.log('✅ Trace Check passed.');