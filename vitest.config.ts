import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import tailwindcss from '@tailwindcss/vite'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Vitest bundles real React, so the automatic runtime is safe here and avoids
  // React's "outdated JSX transform" warning. The shipped bundle stays on the
  // classic runtime via tsconfig's `"jsx": "react"` — Storybook's manager
  // runtime requires it. See tsconfig.json.
  oxc: { jsx: { runtime: 'automatic' } },
  optimizeDeps: {
    include: ['react/jsx-dev-runtime', '@storybook/react-vite', 'storybook/internal/csf'],
  },
  // Every test is a story or a `story.test()` child, so the Storybook plugin
  // owns test discovery. It reads the `stories` glob from .storybook/main.ts.
  plugins: [tailwindcss(), storybookTest()],
  test: {
    // The addon rewrites live CSSOM, which jsdom does not model.
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' as const }],
      screenshotFailures: false,
    },
  },
})
