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
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "JSXAttribute[name.name=/^on[A-Z]/] CallExpression[callee.object.name='router'][callee.property.name=/^(push|replace)$/]",
          message:
            '클릭 핸들러에서 router.push/replace 금지 — 내비게이션은 next/link <Link>(Button 은 asChild)를 쓰세요. 불가피한 imperative 는 핸들러를 별도 함수로 분리하거나 eslint-disable 에 사유를 남기세요.',
        },
        {
          selector:
            'JSXElement[openingElement.name.name="Form"] JSXOpeningElement[name.name="Button"]:has(JSXAttribute[name.name="type"] Literal[value="submit"])',
          message:
            'RHF <Form> 안 제출 버튼은 raw <Button type="submit"> 대신 FormSubmitButton 을 쓰세요 (#400 표준: submit 자동 + isLoading + 채움 게이트).',
        },
      ],
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
])
