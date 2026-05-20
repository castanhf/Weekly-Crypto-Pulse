import { readFileSync } from 'node:fs';
import path from 'node:path';

const AGENT_SPEC_DIR = path.resolve(process.cwd(), '.claude/agents');

const stripFrontmatter = (content: string): string => {
  const normalized = content.replace(/\r\n/g, '\n');
  return normalized.replace(/^---\n[\s\S]*?\n---\n+/, '').trim();
};

export const loadAgentSpec = (agentName: string): string | null => {
  const specPath = path.join(AGENT_SPEC_DIR, `${agentName}.md`);
  try {
    const raw = readFileSync(specPath, 'utf-8');
    return stripFrontmatter(raw);
  } catch {
    return null;
  }
};
