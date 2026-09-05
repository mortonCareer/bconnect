import base from '@bconnect/config/eslint/base'
import figma from '@bconnect/config/eslint/figma'
import { defineConfig, includeIgnoreFile } from 'eslint/config'
import { fileURLToPath } from 'node:url'

const gitignorePath = fileURLToPath(new URL('../../.gitignore', import.meta.url))

export default defineConfig([
  includeIgnoreFile(gitignorePath, { gitignoreResolution: true }),
  ...base,
  {
    settings: { next: { rootDir: import.meta.dirname } },
  },
  {
    files: ['**/page.tsx'],
    plugins: { figma },
    rules: {
      'figma/figma-tag': 'error',
    },
  },
])
