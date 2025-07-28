#!/usr/bin/env node
/**
 * 根据 PR label 限制敏感路径改动（示例：bot-implementer）
 */
import { execSync } from 'node:child_process';
const sh = (c) => execSync(c, { stdio: ['ignore','pipe','pipe'] }).toString();

const base = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'HEAD~1';
const head = process.env.GITHUB_SHA || 'HEAD';
const labels = (process.env.PR_LABELS || '').split(',').map(s => s.trim()).filter(Boolean);
const isBot = labels.includes('bot-implementer');

const diff = sh(`git diff --name-status ${base} ${head}`).trim().split('\n').filter(Boolean)
  .map(line => { const [status, ...rest] = line.split(/\s+/); return { status, file: rest.join(' ') }; });

const forbidden = [];
for (const { file } of diff) {
  if (isBot) {
    if (/^\.github\/workflows\/|^SPEC_POLICY\.md$|^CONTRIBUTING\.md$/.test(file)) forbidden.push(file);
  }
}

if (forbidden.length) { console.error('❌ Permission Check failed. Bot cannot modify:\n' + forbidden.join('\n')); process.exit(1); }
console.log('✅ Permission Check passed.');