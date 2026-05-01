import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'
import figma from './packages/config/eslint/plugin-figma.js'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['**/node_modules/', '**/.next/', '**/dist/'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'prefer-const': 'warn',
    },
  },
  {
    files: ['packages/ui/src/components/ui/*.tsx'],
    plugins: { 'bconnect-figma': figma },
    rules: {
      'bconnect-figma/require-figma-tag': 'error',
    },
  }
)
