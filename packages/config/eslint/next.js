import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import figma from './plugin-figma.js'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['**/page.tsx'],
    plugins: { 'morton-figma': figma },
    rules: {
      'morton-figma/require-figma-tag': 'error',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
])
