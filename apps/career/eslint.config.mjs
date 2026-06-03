import config from '@bconnect/config/eslint/next'

export default [
  ...config,
  {
    files: ['**/one-click/_components/ShareButton.tsx'],
    rules: { 'react/forbid-elements': 'off' },
  },
]
