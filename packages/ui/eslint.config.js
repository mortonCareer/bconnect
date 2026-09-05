import base from '@bconnect/config/eslint/base'
import figma from '@bconnect/config/eslint/figma'
import { defineConfig, includeIgnoreFile } from 'eslint/config'
import { fileURLToPath } from 'node:url'

const gitignorePath = fileURLToPath(new URL('../../.gitignore', import.meta.url))

const uiConfig = defineConfig([
  includeIgnoreFile(gitignorePath, { gitignoreResolution: true }),
  ...base,
  {
    files: ['src/icons/**/*.tsx'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['src/components/**/*.tsx'],
    plugins: { figma },
    rules: {
      'figma/figma-tag': 'error',
    },
  },
])

export default uiConfig
