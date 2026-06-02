import config from '@bconnect/config/eslint/base'

const uiConfig = [
  ...config,
  {
    files: ['src/**/*.tsx'],
    ignores: ['src/icons/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXOpeningElement[name.name='svg']",
          message:
            '인라인 <svg> 금지 — 아이콘은 src/icons 공통 컴포넌트로 정의하고 @bconnect/ui 에서 import 하세요 (#458).',
        },
      ],
    },
  },
]

export default uiConfig
