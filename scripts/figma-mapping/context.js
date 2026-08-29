/**
 * Figma context loader.
 */

import { readFileSync, readdirSync } from 'node:fs'

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN
const FIGMA_API = 'https://api.figma.com/v1'

// Morton 디자인 파일
// https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS
const FIGMA_FILE_KEY = 'EFXofON7gTFbmbE2kB31SS'

// https://www.figma.com/design/<fileKey>/<fileName>?node-id=<nodeId>
const FIGMA_URL_REGEX =
  /https:\/\/(?:www\.)?figma\.com\/design\/([A-Za-z0-9]+)[^?\s]*\?[^=\s]*node-id=([\d-]+)/

// 블록 주석
const JSDOC_BLOCK_REGEX = /\/\*\*[\s\S]*?\*\//

// 각 주석줄의 선행 "* "
const JSDOC_PREFIX_REGEX = /^\s*\*\s?/

// @figma, @figma-todo
const FIGMA_TAG_REGEX = /@figma(?:-todo)?(?![-\w])/

// @figma <url>
const FIGMA_REGEX = /^@figma\s+(\S+)/

// 탐색 범위
const SEARCH_ROOTS = ['apps/career', 'apps/plan', 'apps/company', 'packages/ui/src/components']
const SEARCH_EXCLUDES = new Set(['node_modules', '.next', 'dist', 'build'])

// 검사 대상
const isSearchTarget = (file) =>
  file.endsWith('/page.tsx') || file.startsWith('packages/ui/src/components/')

/**
 * 컴포넌트 @figma 태그
 *
 * @typedef {Object} FigmaTag
 * @property {string} file - 상대 경로
 * @property {Array<{url: string, nodeId: string}>} nodes - @figma @figma-todo 라인
 * @property {'figma' | 'todo' | 'unknown'} type
 */

/**
 * Figma 노드
 *
 * @typedef {Object} FigmaNode
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {string|null} parentId
 * @property {string|null} parentName
 * @property {string[]} childIds
 * @property {boolean} readyForDev
 */

/**
 * Figma 컨텍스트
 *
 * @typedef {Object} FigmaContext
 * @property {string} fileKey
 * @property {Map<string, FigmaNode>} nodes - id → node
 * @property {FigmaTag[]} tags
 */

/**
 * Node ID 정규화: "1234-5678" → "1234:5678"
 */
function normalizeNodeId(id) {
  return id.replace('-', ':')
}

/**
 * @figma JSDoc 태그 파싱
 * @param {string} content
 */
function parseTags(content) {
  const blockMatch = content.match(JSDOC_BLOCK_REGEX)
  if (!blockMatch) {
    return { nodes: [], type: 'unknown' }
  }

  const block = blockMatch[0]

  /** @type {Array<{url: string, nodeId: string}>} */
  const nodes = []

  /** @type {'figma' | 'todo' | 'unknown'} */
  let type = 'unknown'

  for (const rawLine of block.split('\n')) {
    const line = rawLine.replace(JSDOC_PREFIX_REGEX, '').trim()
    if (!line) continue

    if (line.startsWith('@figma-todo')) {
      type = 'todo'
      continue
    }
    if (line.startsWith('@figma ')) {
      const m = line.match(FIGMA_REGEX)
      if (m) {
        const urlMatch = m[1].match(FIGMA_URL_REGEX)
        if (urlMatch) {
          nodes.push({ url: m[1], nodeId: normalizeNodeId(urlMatch[2]) })
          type = 'figma'
        }
      }
    }
  }

  return { nodes, type }
}

/**
 * 디렉토리 DFS 순회
 *
 * @param {string} dir
 * @param {string[]} acc
 */
function walkComponent(dir, acc) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (SEARCH_EXCLUDES.has(entry.name)) continue

    const fullPath = `${dir}/${entry.name}`
    if (entry.isDirectory()) {
      walkComponent(fullPath, acc)
    } else if (entry.name.endsWith('.tsx')) {
      acc.push(fullPath)
    }
  }
}

/**
 * @returns {FigmaTag[]}
 */
function loadTags() {
  const files = []
  for (const root of SEARCH_ROOTS) {
    walkComponent(root, files)
  }

  const tags = []
  for (const file of files.filter(isSearchTarget)) {
    let content
    try {
      content = readFileSync(file, 'utf8')
    } catch (e) {
      console.error(`Failed to read ${file}: ${e.message}`)
      continue
    }
    if (!FIGMA_TAG_REGEX.test(content)) continue
    const parsed = parseTags(content)
    tags.push({ file, ...parsed })
  }
  return tags
}

/**
 * Figma 파일 트리 전체 로드 · 탐색
 *
 * @param {string} fileKey
 * @returns {Promise<Map<string, FigmaNode>>}
 */
async function loadTree(fileKey) {
  if (!FIGMA_TOKEN) {
    throw new Error('FIGMA_ACCESS_TOKEN env var is required')
  }

  const url = `${FIGMA_API}/files/${fileKey}`
  const res = await fetch(url, { headers: { 'X-Figma-Token': FIGMA_TOKEN } })
  if (!res.ok) {
    throw new Error(`Figma API ${res.status}: ${await res.text()}`)
  }
  const json = await res.json()

  /** @type {Map<string, FigmaNode>} */
  const nodes = new Map()

  /**
   * Figma 노드 DFS 순회
   * @param {{id: string, name: string, type: string, devStatus?: {type: string}, children?: any[]}} node
   * @param {{id: string, name: string} | null} parent
   */
  function walkNode(node, parent) {
    const childIds = (node.children ?? []).map((c) => c.id)
    nodes.set(node.id, {
      id: node.id,
      name: node.name,
      type: node.type,
      parentId: parent?.id ?? null,
      parentName: parent?.name ?? null,
      childIds,
      readyForDev: node.devStatus?.type === 'READY_FOR_DEV',
    })
    for (const child of node.children ?? []) {
      walkNode(child, { id: node.id, name: node.name })
    }
  }

  walkNode(json.document, null)
  return nodes
}

/**
 * 컨텍스트 로드
 * @returns {Promise<FigmaContext>}
 */
export async function loadContext() {
  const tags = loadTags()
  const nodes = await loadTree(FIGMA_FILE_KEY)

  return { fileKey: FIGMA_FILE_KEY, nodes, tags }
}
