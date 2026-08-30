import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss()],
  // Storybook's preview bundles real React, so the automatic JSX runtime is
  // fine (and avoids React's "outdated JSX transform" warning). The shipped
  // bundle stays on the classic runtime via tsconfig's `"jsx": "react"`, which
  // is what Storybook's manager runtime requires — see tsconfig.json.
  oxc: { jsx: { runtime: 'automatic' } },
  optimizeDeps: { include: ['react/jsx-dev-runtime'] },
})
