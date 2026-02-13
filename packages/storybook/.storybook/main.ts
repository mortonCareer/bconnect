import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../../../packages/ui/src/**/*.stories.@(ts|tsx)'],

  addons: ['@storybook/addon-a11y', '@storybook/addon-themes'],

  framework: { name: '@storybook/react-vite', options: {} },

  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },

  async viteFinal(config) {
    const { default: tailwindcss } = await import('@tailwindcss/vite')
    const { mergeConfig } = await import('vite')
    const { resolve } = await import('node:path')

    return mergeConfig(config, {
      base: process.env.STORYBOOK_BASE || '/',
      plugins: [tailwindcss()],
      resolve: {
        alias: { '@': resolve(import.meta.dirname, '../../../packages/ui/src') },
      },
    })
  },
}

export default config
