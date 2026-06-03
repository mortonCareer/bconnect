import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import figma from './plugin-figma.js'
import tailwind from './tailwind.js'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  tailwind,
  {
    files: ['**/page.tsx'],
    plugins: { 'bconnect-figma': figma },
    rules: {
      'bconnect-figma/require-figma-tag': 'error',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../**'],
              message:
                '2단계 이상 상위 경로는 @/ alias 를 사용하세요 (단일 ../ co-location 은 허용).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.tsx'],
    rules: {
      'react/forbid-elements': [
        'error',
        {
          forbid: [
            {
              element: 'svg',
              message:
                '인라인 <svg> 금지 — 아이콘은 packages/ui/src/icons 공통 컴포넌트로 정의하고 @bconnect/ui 에서 import 하세요 (#384).',
            },
          ],
        },
      ],
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
])
