import type { Preview } from '@storybook/react-vite'
import { withThemeByClassName } from '@storybook/addon-themes'
import '@morton/ui/styles'

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: 'centered',
    docs: { toc: true },
    viewport: {
      viewports: {
        mobile: { name: 'Mobile (390px)', styles: { width: '390px', height: '844px' } },
        mobileSm: { name: 'Mobile Small (360px)', styles: { width: '360px', height: '780px' } },
      },
      defaultViewport: 'mobile',
    },
  },

  decorators: [
    withThemeByClassName({ themes: { light: '', dark: 'dark' }, defaultTheme: 'light' }),
  ],

  tags: ['autodocs'],
}

export default preview
