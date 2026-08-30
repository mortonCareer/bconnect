const FIGMA_URL_BASE = 'https://www.figma.com/design'

const nodeUrl = (fileKey, nodeId) =>
  `${FIGMA_URL_BASE}/${fileKey}?node-id=${nodeId.replace(':', '-')}`

/**
 * @param {import('./context.js').FigmaContext} ctx
 * @returns {Promise<import('./report.js').Result[]>}
 */
export async function checkFigmaMapping(ctx) {
  const results = []

  // 컴포넌트
  const nodeIds = new Set()
  for (const tag of ctx.tags) {
    for (const node of tag.nodes) nodeIds.add(node.nodeId)
  }

  // ready for dev 노드
  const readyNodes = []
  for (const node of ctx.nodes.values()) {
    if (node.readyForDev) readyNodes.push(node)
  }

  // unmapped node
  for (const frame of readyNodes) {
    if (nodeIds.has(frame.id)) continue
    results.push({
      checkName: 'unmapped-node',
      parentNode: frame.parentName || '최상위노드',
      nodeId: frame.id,
      nodeName: frame.name,
      url: nodeUrl(ctx.fileKey, frame.id),
    })
  }

  for (const tag of ctx.tags) {
    if (tag.type !== 'figma') continue

    for (const { url, nodeId: mappedNodeId } of tag.nodes) {
      const node = ctx.nodes.get(mappedNodeId)

      // not found
      if (!node) {
        results.push({
          checkName: 'not-found',
          file: tag.file,
          nodeId: mappedNodeId,
          url,
        })
        continue
      }

      // not ready
      if (!node.readyForDev) {
        results.push({
          checkName: 'not-ready',
          file: tag.file,
          nodeId: node.id,
          nodeName: node.name,
          url,
        })
      }
    }
  }

  return results
}
