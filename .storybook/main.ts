import { defineMain } from '@storybook/react-vite/node'
import remarkGfm from 'remark-gfm'

export default defineMain({
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(ts|tsx)',
    '../stories/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    {
      name: '@storybook/addon-docs',
      // Storybook does not ship GFM, so MDX tables render as plain text without this.
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: { remarkPlugins: [remarkGfm] },
        },
      },
    },
    '@storybook/addon-vitest',
    'storybook-addon-tag-badges',
    '@storybook-community/storybook-dark-mode',
    import.meta.resolve('./local-preset.ts'),
  ],
  framework: '@storybook/react-vite',
  // Enables `story.test()` on CSF Next story factories.
  features: { experimentalTestSyntax: true },
})
