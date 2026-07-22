import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'
import tailwind from './tailwind.js'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['**/node_modules/', '**/.next/', '**/dist/', '**/generated/'],
  },
  tailwind,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'prefer-const': 'warn',
    },
  }
)
