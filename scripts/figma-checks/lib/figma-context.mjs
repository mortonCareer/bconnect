/**
 * Figma context loader.
 *
 * 코드 파일에서 @figma/@figma-state JSDoc 태그를 추출하고,
 * Figma REST API로 파일 전체 트리(node 메타 + 부모 관계)를 한 번에 로드.
 * 모든 check 함수가 공유하는 단일 데이터 소스.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN
const FIGMA_API = 'https://api.figma.com/v1'

const FIGMA_URL_RE =
  /https:\/\/(?:www\.)?figma\.com\/design\/([A-Za-z0-9]+)[^?\s]*\?[^=\s]*node-id=([\d-]+)/

/**
 * @typedef {Object} CodeFigmaTag
 * @property {string} file - 상대 경로
 * @property {string|null} primaryUrl - @figma URL (없으면 scaffold/pending)
 * @property {string|null} primaryNodeId - 콜론 형식 node ID (e.g. "1234:5678")
 * @property {Array<{name: string, url: string, nodeId: string}>} states - @figma-state 항목들
 * @property {'figma' | 'scaffold' | 'pending'} kind
 */

/**
 * @typedef {Object} FigmaNode
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {string|null} parentId
 * @property {string|null} parentName
 * @property {string[]} childIds
 * @property {boolean} devReady - Dev Mode에서 "Ready for dev" 마킹 여부
 */

/**
 * @typedef {Object} FigmaContext
 * @property {string} fileKey
 * @property {Map<string, FigmaNode>} nodes - id → node (id format: "1234:5678")
 * @property {CodeFigmaTag[]} codeTags
 */

/**
 * Node ID 정규화: "1234-5678" → "1234:5678"
 */
function normalizeNodeId(id) {
  return id.replace('-', ':')
}

/**
 * @figma JSDoc 태그 파싱
 * @param {string} content - 파일 내용
 * @returns {Omit<CodeFigmaTag, 'file'>}
 */
function parseFigmaTags(content) {
  // 첫 번째 block comment만 검사
  const blockMatch = content.match(/\/\*\*[\s\S]*?\*\//)
  if (!blockMatch) {
    return { primaryUrl: null, primaryNodeId: null, states: [], kind: 'pending' }
  }

  const block = blockMatch[0]
  let primaryUrl = null
  let primaryNodeId = null
  /** @type {Array<{name: string, url: string, nodeId: string}>} */
  const states = []
  /** @type {'figma' | 'scaffold' | 'pending'} */
  let kind = 'pending'

  for (const rawLine of block.split('\n')) {
    const line = rawLine.replace(/^\s*\*\s?/, '').trim()
    if (!line) continue

    if (line.startsWith('@figma-scaffold')) {
      kind = 'scaffold'
      continue
    }
    if (line.startsWith('@figma-pending')) {
      kind = 'pending'
      continue
    }
    if (line.startsWith('@figma-state ')) {
      const m = line.match(/^@figma-state\s+(\S+)\s+(\S+)/)
      if (m) {
        const [, name, url] = m
        const urlMatch = url.match(FIGMA_URL_RE)
        if (urlMatch) {
          states.push({ name, url, nodeId: normalizeNodeId(urlMatch[2]) })
        }
      }
      continue
    }
    if (line.startsWith('@figma ')) {
      const m = line.match(/^@figma\s+(\S+)/)
      if (m) {
        const url = m[1]
        const urlMatch = url.match(FIGMA_URL_RE)
        if (urlMatch) {
          primaryUrl = url
          primaryNodeId = normalizeNodeId(urlMatch[2])
          kind = 'figma'
        }
      }
    }
  }

  return { primaryUrl, primaryNodeId, states, kind }
}

/**
 * 재귀 디렉토리 walk — node_modules/.next/dist 제외
 * @param {string} dir
 * @param {string[]} acc
 */
function walkTsx(dir, acc) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === '.next' || entry === 'dist' || entry === 'build') {
      continue
    }
    const full = path.join(dir, entry)
    let stat
    try {
      stat = statSync(full)
    } catch {
      continue
    }
    if (stat.isDirectory()) {
      walkTsx(full, acc)
    } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
      acc.push(full)
    }
  }
}

/**
 * apps/, packages/ 아래에서 @figma 태그 가진 파일 찾고 파싱
 * @returns {CodeFigmaTag[]}
 */
function loadCodeTags() {
  const files = []
  for (const root of ['apps', 'packages']) {
    walkTsx(root, files)
  }

  const tags = []
  for (const file of files) {
    let content
    try {
      content = readFileSync(file, 'utf8')
    } catch (e) {
      console.error(`Failed to read ${file}: ${e.message}`)
      continue
    }
    if (!/@figma(?:\b|-)/.test(content)) continue
    const parsed = parseFigmaTags(content)
    tags.push({ file, ...parsed })
  }
  return tags
}

/**
 * Figma 파일 트리 한 번에 로드. 깊이 제한 없이 전체.
 * Walk하며 nodeId → node 인덱스 구축 (parent 정보 포함).
 * @param {string} fileKey
 * @returns {Promise<Map<string, FigmaNode>>}
 */
async function loadFigmaTree(fileKey) {
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
   * 재귀 walk
   * @param {{id: string, name: string, type: string, devStatus?: {type: string}, children?: any[]}} node
   * @param {{id: string, name: string} | null} parent
   */
  function walk(node, parent) {
    const childIds = (node.children ?? []).map((c) => c.id)
    nodes.set(node.id, {
      id: node.id,
      name: node.name,
      type: node.type,
      parentId: parent?.id ?? null,
      parentName: parent?.name ?? null,
      childIds,
      devReady: node.devStatus?.type === 'READY_FOR_DEV',
    })
    for (const child of node.children ?? []) {
      walk(child, { id: node.id, name: node.name })
    }
  }

  // document → pages → ... → frames
  walk(json.document, null)
  return nodes
}

/**
 * 컨텍스트 한 번에 로드 — 모든 check 함수가 사용
 * @returns {Promise<FigmaContext>}
 */
export async function loadFigmaContext() {
  const codeTags = loadCodeTags()

  // 모든 코드의 @figma URL에서 fileKey 추출 (모두 같다고 가정 — Morton은 디자인 파일 1개)
  const fileKeys = new Set()
  for (const tag of codeTags) {
    if (tag.primaryUrl) {
      const m = tag.primaryUrl.match(FIGMA_URL_RE)
      if (m) fileKeys.add(m[1])
    }
    for (const s of tag.states) {
      const m = s.url.match(FIGMA_URL_RE)
      if (m) fileKeys.add(m[1])
    }
  }

  if (fileKeys.size === 0) {
    throw new Error('코드에서 @figma URL을 하나도 찾지 못했습니다')
  }
  if (fileKeys.size > 1) {
    console.warn(`다중 Figma 파일 감지: ${[...fileKeys].join(', ')} — 첫 번째만 사용`)
  }

  const fileKey = [...fileKeys][0]
  const nodes = await loadFigmaTree(fileKey)

  return { fileKey, nodes, codeTags }
}
