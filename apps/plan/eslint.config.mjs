import config from '@bconnect/config/eslint/next'

const planConfig = [
  ...config,
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
]

export default planConfig
