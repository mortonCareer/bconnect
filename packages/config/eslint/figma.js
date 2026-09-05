/**
 * ESLint plugin for Figma JSDoc tags
 */

const FIGMA_URL_PREFIXES = ['https://www.figma.com/', 'https://figma.com/']

const JSDOC_PREFIX_REGEX = /^\s*\*\s?/

// @figma, @figma-todo
const FIGMA_TAG_REGEX = /@figma(?:-todo)?(?![-\w])/

// @figma <url>
const FIGMA_REGEX = /^@figma(?:\s+(\S.*))?$/

// @figma-todo <description>
const FIGMA_TODO_REGEX = /^@figma-todo(?:\s+(\S.*))?$/

const rules = {
  'figma-tag': {
    meta: {
      type: 'problem',
      docs: {
        description:
          'Require @figma or @figma-todo JSDoc tag at the top of page.tsx and design system component files.',
      },
      schema: [],
      messages: {
        missing:
          'File must have @figma JSDoc tag at the top. See `docs/reference/figma-tag.md` for details.',
        invalidFigma: 'Use @figma <url> format.',
        invalidTodo: 'Use @figma-todo <description> format.',
      },
    },
    create(context) {
      return {
        Program(node) {
          const code = context.sourceCode
          const comments = code.getAllComments()

          // @figma block comment
          const block = comments.find((c) => c.type === 'Block' && FIGMA_TAG_REGEX.test(c.value))
          if (!block) {
            context.report({
              node,
              messageId: 'missing',
            })
            return
          }

          const text = block.value
          const lines = text.split('\n')

          let hasTag = false

          for (const rawLine of lines) {
            // JSDoc 줄 앞의 "* " 제거
            const line = rawLine.replace(JSDOC_PREFIX_REGEX, '').trim()
            if (!line) continue

            // @figma <url>
            const figma = line.match(FIGMA_REGEX)
            if (figma) {
              hasTag = true
              const url = figma[1]?.trim()
              if (!url || !FIGMA_URL_PREFIXES.some((p) => url.startsWith(p))) {
                context.report({ node, messageId: 'invalidFigma' })
              }
              continue
            }

            // @figma-todo <description>
            const todo = line.match(FIGMA_TODO_REGEX)
            if (todo) {
              hasTag = true
              if (!todo[1]?.trim()) {
                context.report({ node, messageId: 'invalidTodo' })
              }
              continue
            }
          }

          if (!hasTag) {
            context.report({ node, messageId: 'missing' })
          }
        },
      }
    },
  },
}

const plugin = {
  meta: { name: 'figma', version: '0.1.0' },
  rules,
}

export default plugin
