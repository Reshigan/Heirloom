/**
 * Node.js-side global setup for worker tests.
 * Runs BEFORE any worker test file. Reads SQL migration files from the host
 * filesystem (not available inside the Workers sandbox) and provides them to
 * the worker environment via vitest's provide() / inject() mechanism.
 *
 * In vitest 4.x, setup() receives the TestProject instance as its argument;
 * call project.provide() rather than importing the deprecated vitest/suite path.
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface TestProject {
  provide(key: string, value: unknown): void;
}

export async function setup(project: TestProject): Promise<void> {
  const migrationsDir = join(__dirname, '../../../../migrations');
  const files = readdirSync(migrationsDir)
    .filter((f: string) => f.endsWith('.sql'))
    .sort();

  const migrationSql: string[] = files.map((f: string) =>
    readFileSync(join(migrationsDir, f), 'utf-8'),
  );

  project.provide('migrationSql', migrationSql);
}
