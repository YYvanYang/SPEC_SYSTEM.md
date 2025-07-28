#!/usr/bin/env node
/**
 * 校验内容：
 * - requirements.md：R-*（EARS + Acceptance + Negative + Out-of-Scope）
 * - design.md：Mermaid 图、Risks、Rollback
 * - tasks.md：存在任务、每条含 Trace: R-* 与 Done:
 */
import { globby } from 'globby';
import fs from 'node:fs/promises';

let failed = false;
const fail = (msg) => { console.error(msg); failed = true; };

const files = await globby(['specs/**/v*/{requirements,design,tasks}.md'], { dot: true });
if (files.length === 0) fail('❌ No spec files found under specs/**/v*/');

for (const file of files) {
  const text = await fs.readFile(file, 'utf8');

  if (file.endsWith('requirements.md')) {
    if (!/Out-of-Scope/i.test(text)) fail(`❌ ${file}: missing "Out-of-Scope" section`);
    const blocks = text.match(/##\s*R-\d+[\s\S]*?(?=##\s*R-\d+|$)/g) || [];
    if (blocks.length === 0) fail(`❌ ${file}: no "R-*" sections found`);
    for (const b of blocks) {
      if (!/WHEN[\s\S]+THE SYSTEM SHALL/i.test(b)) fail(`❌ ${file}: EARS sentence missing:\n${b.slice(0,120)}...`);
      if (!/Acceptance:/i.test(b)) fail(`❌ ${file}: Acceptance criteria missing`);
      if (!/Negative:/i.test(b)) fail(`❌ ${file}: Negative case missing`);
    }
  }

  if (file.endsWith('design.md')) {
    if (!/sequenceDiagram|flowchart|classDiagram|stateDiagram/i.test(text)) fail(`❌ ${file}: no Mermaid diagram found`);
    if (!/Risks/i.test(text)) fail(`❌ ${file}: "Risks" section missing`);
    if (!/Rollback/i.test(text)) fail(`❌ ${file}: "Rollback" section missing`);
  }

  if (file.endsWith('tasks.md')) {
    const tasks = text.match(/- \[.\] .+?(\n\s{2,}.+)+/g) || [];
    if (tasks.length === 0) fail(`❌ ${file}: no tasks found`);
    for (const t of tasks) {
      if (!/Trace:\s*R-\d+/i.test(t)) fail(`❌ ${file}: task without "Trace: R-*" →\n${t.split('\n')[0]}`);
      if (!/Done:/i.test(t)) fail(`❌ ${file}: task without "Done:" →\n${t.split('\n')[0]}`);
    }
  }
}

if (failed) { console.error('\nSpec Lint failed.'); process.exit(1); }
console.log('✅ Spec Lint passed.');