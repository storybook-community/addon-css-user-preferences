import { globalPackages as globalManagerPackages } from 'storybook/internal/manager/globals'
import { globalPackages as globalPreviewPackages } from 'storybook/internal/preview/globals'
import { defineConfig, type UserConfig } from 'tsdown'

/**
 * Entries are declared in package.json under `bundler`, split by the runtime
 * that loads them:
 *
 *   managerEntries — loaded into the Storybook manager UI
 *   previewEntries — loaded into the preview iframe, and imported by end users
 *   nodeEntries    — loaded by Storybook in node (presets)
 */
export default defineConfig(async (options) => {
  const packageJson = (await import('./package.json', { with: { type: 'json' } })).default
  const {
    bundler: { managerEntries = [], previewEntries = [], nodeEntries = [] },
  } = packageJson

  const commonConfig = {
    clean: !options.watch,
    format: ['esm'],
    treeshake: true,
    sourcemap: true,
    /*
     Provided by Storybook at runtime, so they must never be bundled in and must
     never become regular dependencies.
    */
    deps: {
      neverBundle: ['react', /^react\/.*$/, 'react-dom', 'storybook', /^storybook\/.*$/],
    },
  } satisfies UserConfig

  const configs: UserConfig[] = []

  /*
   The manager entry only registers the addon, so it needs no declarations.
   Target esnext — Storybook bundles manager entries again anyway.
  */
  if (managerEntries.length) {
    configs.push({
      ...commonConfig,
      entry: managerEntries,
      platform: 'browser',
      target: 'esnext',
      dts: false,
      deps: { neverBundle: [...globalManagerPackages, ...commonConfig.deps.neverBundle] },
    })
  }

  /*
   Preview entries get declarations: end users import them for portable stories
   and for the `cssUserPrefs` parameter types.
  */
  if (previewEntries.length) {
    configs.push({
      ...commonConfig,
      entry: previewEntries,
      platform: 'browser',
      target: 'esnext',
      dts: true,
      deps: { neverBundle: [...globalPreviewPackages, ...commonConfig.deps.neverBundle] },
    })
  }

  if (nodeEntries.length) {
    configs.push({
      ...commonConfig,
      entry: nodeEntries,
      platform: 'node',
      target: 'node20.19',
    })
  }

  return configs
})
