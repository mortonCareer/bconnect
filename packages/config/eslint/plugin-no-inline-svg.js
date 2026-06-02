/**
 * ESLint plugin: bconnect-svg
 *
 * Bans inline <svg> in JSX so every icon lives in packages/ui/src/icons as a
 * shared component imported from @bconnect/ui. Scope the rule per app/package via
 * flat-config `files`/`ignores` (icons dir must be exempt). See issue #384.
 */

const rules = {
  'no-inline-svg': {
    meta: {
      type: 'problem',
      docs: {
        description:
          'Disallow inline <svg> in JSX. Define icons in packages/ui/src/icons and import from @bconnect/ui.',
      },
      schema: [],
      messages: {
        inlineSvg:
          '인라인 <svg> 금지 — 아이콘은 packages/ui/src/icons 공통 컴포넌트로 정의하고 @bconnect/ui 에서 import 하세요 (issue #384).',
      },
    },
    create(context) {
      return {
        JSXOpeningElement(node) {
          const name = node.name
          if (name && name.type === 'JSXIdentifier' && name.name === 'svg') {
            context.report({ node, messageId: 'inlineSvg' })
          }
        },
      }
    },
  },
}

const plugin = {
  meta: { name: 'bconnect-svg', version: '0.1.0' },
  rules,
}

export default plugin
