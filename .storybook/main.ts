import type { StorybookConfig } from '@storybook/react-vite'

export default {
  stories: ['../stories/**/*.stories.@(js|jsx|ts|tsx)', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-vitest',
    'storybook-addon-tag-badges',
    '@storybook-community/storybook-dark-mode',
    import.meta.resolve('./local-preset.ts'),
  ],
  framework: '@storybook/react-vite',
  // Enables `story.test()` on CSF Next story factories.
  features: { experimentalTestSyntax: true },
} satisfies StorybookConfig
