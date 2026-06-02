import config from '@bconnect/config/eslint/next'
import noInlineSvg from '@bconnect/config/eslint/plugin-no-inline-svg'

const planConfig = [
  ...config,
  {
    files: ['**/*.tsx'],
    plugins: { 'bconnect-svg': noInlineSvg },
    rules: { 'bconnect-svg/no-inline-svg': 'error' },
  },
]

export default planConfig
