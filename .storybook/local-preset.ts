import { fileURLToPath } from 'node:url'

/**
 * Loads the manager side from `src` during development. The preview side comes
 * from `.storybook/preview.ts`, which registers the addon through CSF Next.
 */
export function managerEntries(entry: string[] = []) {
  return [...entry, fileURLToPath(import.meta.resolve('../src/manager.ts'))]
}
