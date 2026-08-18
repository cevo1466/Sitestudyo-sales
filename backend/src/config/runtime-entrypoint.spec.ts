import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('production runtime entrypoint', () => {
  it('starts the main file emitted by the TypeScript build', () => {
    const dockerfile = readFileSync(resolve(process.cwd(), 'Dockerfile'), 'utf8');
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
    ) as { scripts: Record<string, string> };

    expect(dockerfile).toContain('CMD ["node", "dist/src/main.js"]');
    expect(packageJson.scripts.start).toBe('node dist/src/main.js');
  });
});
