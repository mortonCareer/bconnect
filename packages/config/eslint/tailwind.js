import path from 'node:path'
import tailwindcss from 'eslint-plugin-tailwindcss'

// Tailwind v4 has no JS config; point the plugin at the CSS entry (@theme tokens).
// Absolute so it resolves regardless of which app/package cwd runs eslint.
const config = path.resolve(import.meta.dirname, '../../ui/src/styles/globals.css')

export default {
  files: ['**/*.{ts,tsx}'],
  plugins: { tailwindcss },
  settings: { tailwindcss: { config } },
  rules: {
    'tailwindcss/no-arbitrary-value': 'warn',
  },
}
