/**
 * ESLint plugin: bconnect-figma
 *
 * Enforces presence of `@figma` JSDoc tag in page.tsx and packages/ui components,
 * so that Figma ↔ code mapping is co-located with the source (SSoT).
 *
 * See issue #256 for context.
 */

const FIGMA_URL_PREFIXES = ['https://www.figma.com/', 'https://figma.com/']

const rules = {
  'require-figma-tag': {
    meta: {
      type: 'problem',
      docs: {
        description:
          'Require @figma, @figma-scaffold, or @figma-pending JSDoc tag at the top of page.tsx and design system component files.',
      },
      schema: [],
      messages: {
        missing:
          '파일 상단에 @figma <url>, @figma-scaffold <reason>, 또는 @figma-pending <description> JSDoc 태그가 필요합니다. 자세한 내용은 packages/ui/CLAUDE.md 참조.',
        figmaInvalidUrl: '@figma 뒤에는 Figma URL(https://www.figma.com/design/...)이 와야 합니다.',
        scaffoldNoReason:
          '@figma-scaffold 뒤에는 사유 또는 이슈 링크가 필요합니다 (예: "@figma-scaffold 디자인 미정 (#193)").',
        pendingNoDescription: '@figma-pending 뒤에는 설명 또는 이슈 링크가 필요합니다.',
        stateInvalidUrl:
          '@figma-state <name> 뒤에는 Figma URL(https://www.figma.com/design/...)이 와야 합니다.',
      },
    },
    create(context) {
      return {
        Program(node) {
          const sourceCode = context.sourceCode
          const allComments = sourceCode.getAllComments()

          // Find any block comment with @figma* tag near the top of the file
          const figmaBlock = allComments.find(
            (c) => c.type === 'Block' && /@figma(?:\b|-)/.test(c.value)
          )

          if (!figmaBlock) {
            context.report({
              node,
              messageId: 'missing',
            })
            return
          }

          const text = figmaBlock.value
          const lines = text.split('\n')

          let hasPrimaryTag = false

          for (const rawLine of lines) {
            // Strip leading "* " typical in JSDoc blocks
            const line = rawLine.replace(/^\s*\*\s?/, '').trim()
            if (!line) continue

            // @figma <url>  (not @figma-something)
            const figmaMatch = line.match(/^@figma(?:\s+(\S.*))?$/)
            if (figmaMatch) {
              hasPrimaryTag = true
              const url = figmaMatch[1]?.trim()
              if (!url || !FIGMA_URL_PREFIXES.some((p) => url.startsWith(p))) {
                context.report({ node, messageId: 'figmaInvalidUrl' })
              }
              continue
            }

            // @figma-scaffold <reason>
            const scaffoldMatch = line.match(/^@figma-scaffold(?:\s+(\S.*))?$/)
            if (scaffoldMatch) {
              hasPrimaryTag = true
              if (!scaffoldMatch[1]?.trim()) {
                context.report({ node, messageId: 'scaffoldNoReason' })
              }
              continue
            }

            // @figma-pending <description>
            const pendingMatch = line.match(/^@figma-pending(?:\s+(\S.*))?$/)
            if (pendingMatch) {
              hasPrimaryTag = true
              if (!pendingMatch[1]?.trim()) {
                context.report({ node, messageId: 'pendingNoDescription' })
              }
              continue
            }

            // @figma-state <name> <url>
            const stateMatch = line.match(/^@figma-state\s+\S+\s+(\S.*)$/)
            if (stateMatch) {
              const url = stateMatch[1].trim()
              if (!FIGMA_URL_PREFIXES.some((p) => url.startsWith(p))) {
                context.report({ node, messageId: 'stateInvalidUrl' })
              }
              continue
            }
          }

          if (!hasPrimaryTag) {
            context.report({ node, messageId: 'missing' })
          }
        },
      }
    },
  },
}

const plugin = {
  meta: { name: 'bconnect-figma', version: '0.1.0' },
  rules,
}

export default plugin
