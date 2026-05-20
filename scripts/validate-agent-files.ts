import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const AGENTS_DIRECTORY = path.resolve(process.cwd(), '.claude', 'agents');

type AgentRequirement = Readonly<{
  requiredSections: ReadonlyArray<string>;
  requiresFrontmatter: boolean;
}>;

const UNIVERSAL_REQUIREMENTS: AgentRequirement = {
  requiredSections: [],
  requiresFrontmatter: true
};

const AGENT_REQUIREMENTS: ReadonlyMap<string, AgentRequirement> = new Map([
  [
    'daily_researcher.md',
    {
      requiredSections: [
        '## Mission',
        '## Data Sources',
        '## Output Schema',
        '## Validation Rules',
        '## Failure Handling',
        '## Drift Tracking'
      ],
      requiresFrontmatter: true
    }
  ],
  [
    'daily_writer.md',
    {
      requiredSections: [
        '## Mission',
        '## Voice and Register',
        '## Forbidden and Acceptable Phrasings',
        '## Section-by-Section Instructions',
        '## Hard Validation Rules',
        '## Failure Handling'
      ],
      requiresFrontmatter: true
    }
  ],
  [
    'daily_editor.md',
    {
      requiredSections: [
        '## Mission',
        '## Editorial Checklist',
        '## Outputs',
        '## Auto-Approval After Maximum Rejections'
      ],
      requiresFrontmatter: true
    }
  ],
  [
    'market_researcher.md',
    {
      requiredSections: ['## Drift Tracking'],
      requiresFrontmatter: true
    }
  ],
  [
    'report_pipeline_runner.md',
    {
      requiredSections: ['## Daily Orchestration Sequence', '### Catastrophic-Failure Path'],
      requiresFrontmatter: true
    }
  ]
]);

const MIN_LINE_COUNT: ReadonlyMap<string, number> = new Map([
  ['daily_researcher.md', 200],
  ['daily_writer.md', 200],
  ['daily_editor.md', 200]
]);

type ValidationResult = Readonly<{
  fileName: string;
  passed: boolean;
  errors: ReadonlyArray<string>;
}>;

const hasFrontmatter = (content: string): boolean =>
  content.startsWith('---\n') || content.startsWith('---\r\n');

const validateAgentFile = (fileName: string, content: string): ValidationResult => {
  const errors: string[] = [];
  const lines = content.split('\n');

  const agentReq = AGENT_REQUIREMENTS.get(fileName) ?? UNIVERSAL_REQUIREMENTS;

  if (agentReq.requiresFrontmatter && !hasFrontmatter(content)) {
    errors.push('Missing YAML frontmatter (file must start with ---)');
  }

  for (const section of agentReq.requiredSections) {
    const present = lines.some((line) => line.trimEnd() === section);

    if (!present) {
      errors.push(`Missing required section: "${section}"`);
    }
  }

  const minLines = MIN_LINE_COUNT.get(fileName);

  if (minLines !== undefined && lines.length < minLines) {
    errors.push(`File has ${lines.length} lines; minimum for this agent is ${minLines}`);
  }

  return {
    fileName,
    passed: errors.length === 0,
    errors
  };
};

const main = (): void => {
  const agentFiles = readdirSync(AGENTS_DIRECTORY)
    .filter((name) => name.endsWith('.md'))
    .sort((left, right) => left.localeCompare(right));

  if (agentFiles.length === 0) {
    throw new Error('No agent definition files found in .claude/agents/.');
  }

  const results: ValidationResult[] = [];

  for (const fileName of agentFiles) {
    const filePath = path.join(AGENTS_DIRECTORY, fileName);
    const content = readFileSync(filePath, 'utf-8');

    results.push(validateAgentFile(fileName, content));
  }

  let hasFailures = false;

  for (const result of results) {
    if (result.passed) {
      console.log(`  ✓ ${result.fileName}`);
    } else {
      hasFailures = true;
      console.error(`  ✗ ${result.fileName}`);

      for (const error of result.errors) {
        console.error(`      - ${error}`);
      }
    }
  }

  if (hasFailures) {
    throw new Error('One or more agent definition files failed validation.');
  }

  console.log(`\nValidated ${agentFiles.length} agent definition file(s).`);
};

try {
  main();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown validation error.';
  console.error(`Failed to validate agent files: ${message}`);
  process.exitCode = 1;
}
