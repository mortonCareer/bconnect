#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// 커맨드 라인 인자 파싱
const args = process.argv.slice(2)
const fileIndex = args.indexOf('--file')
const pageIndex = args.indexOf('--page')

if (fileIndex === -1 || !args[fileIndex + 1]) {
  console.error('Usage: node lint.js --file <figma-file.json> [--page <page-name>]')
  process.exit(1)
}

const filePath = args[fileIndex + 1]
const pageName = pageIndex !== -1 ? args[pageIndex + 1] : null

// Figma 파일 로드
let data
try {
  data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
} catch (error) {
  console.error(`파일 읽기 실패: ${error.message}`)
  process.exit(1)
}

// Figma 파일 URL 추출 (packages/ui/figma-mapping.json에서)
let figmaFileKey = 'EFXofON7gTFbmbE2kB31SS' // 기본값
try {
  const mappingPath = path.join(__dirname, '../../../packages/ui/figma-mapping.json')
  if (fs.existsSync(mappingPath)) {
    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'))
    const firstUrl = Object.values(mapping.pages || {})[0]?.figmaUrl
    if (firstUrl) {
      const match = firstUrl.match(/figma\.com\/design\/([^?]+)/)
      if (match) figmaFileKey = match[1]
    }
  }
} catch (e) {
  // figma-mapping.json 없으면 기본값 사용
}

// Figma URL 생성 함수
function getFigmaUrl(nodeId) {
  return `https://www.figma.com/design/${figmaFileKey}?node-id=${encodeURIComponent(nodeId)}`
}

// 이슈 수집
const issues = {
  naming: [],
  autoLayout: [],
  hardcodedColors: [],
  depth: [],
}

// 검증 제외할 페이지 (레퍼런스, 와이어프레임 등)
const EXCLUDED_PAGES = [
  '와이어프레임',
  'References & Drafts',
  'Assets & Design System',
  'References',
  'Wireframe',
  'Draft',
]

// 검증 완화할 색상 (흰색, 검은색 등 기본 색상)
const COMMON_COLORS = ['#FFFFFF', '#000000', '#FFFFFFFF', '#000000FF']

// Ready for Dev 체크 함수
function isReadyForDev(node) {
  // 노드 이름에 "Ready", "Dev", "완료" 등이 포함되어 있는지 확인
  if (node.name) {
    const readyMarkers = ['Ready', 'ready', 'Dev', 'dev', '완료', '개발', 'Final', 'final']
    if (readyMarkers.some((marker) => node.name.includes(marker))) {
      return true
    }
  }
  // 기본적으로 Sprint 페이지는 검증 대상
  return false
}

// 색상이 흰색/검은색 등 기본 색상인지 체크
function isCommonColor(fill) {
  if (!fill || fill.type !== 'SOLID') return false
  const { r, g, b, a = 1 } = fill.color || {}

  // 흰색 체크 (RGB 거의 1)
  if (r > 0.98 && g > 0.98 && b > 0.98) return true

  // 검은색 체크 (RGB 거의 0)
  if (r < 0.02 && g < 0.02 && b < 0.02) return true

  return false
}

// 네이밍 검증
function checkNaming(node, path, nodeId) {
  if (!node.name) return null

  // 기본 이름 체크 (Frame 123, Group 456 등)
  if (/^(Frame|Group|Rectangle|Ellipse|Vector)\s+\d+$/.test(node.name)) {
    return {
      severity: 'warning',
      category: '네이밍',
      path: path,
      nodeId: nodeId,
      issue: `기본 이름 사용: "${node.name}"`,
      suggestion: '설명적인 이름으로 변경 권장 (예: NavigationBar, MenuIcon)',
    }
  }

  // 컴포넌트에서 한글 사용 체크 (화면은 제외)
  if (node.type === 'COMPONENT' && /[가-힣]/.test(node.name)) {
    return {
      severity: 'info',
      category: '네이밍',
      path: path,
      nodeId: nodeId,
      issue: `컴포넌트에 한글 사용: "${node.name}"`,
      suggestion: '영문 사용 권장 (재사용성 및 코드 통합 용이)',
    }
  }

  // 케밥케이스, 스네이크케이스 체크 (TEXT 제외)
  if (/-|_/.test(node.name) && node.type !== 'TEXT' && node.type !== 'FRAME') {
    return {
      severity: 'info',
      category: '네이밍',
      path: path,
      nodeId: nodeId,
      issue: `케밥/스네이크 케이스: "${node.name}"`,
      suggestion: 'PascalCase 또는 Space 구분 권장',
    }
  }

  return null
}

// Auto Layout 검증
function checkAutoLayout(node, path, nodeId) {
  if (node.type === 'FRAME' && !node.layoutMode) {
    if (node.children && node.children.length > 2) {
      return {
        severity: 'warning',
        category: 'Auto Layout',
        path: path,
        nodeId: nodeId,
        issue: 'Auto Layout 미사용',
        suggestion: 'Auto Layout 적용 권장 (반응형 대응, 유지보수 용이)',
      }
    }
  }
  return null
}

// 색상 검증
function checkColors(node, path, nodeId) {
  if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
    // 흰색/검은색 제외하고 하드코딩된 색상 체크
    const hasNonCommonHardcodedColor = node.fills.some(
      (fill) =>
        fill.type === 'SOLID' && !fill.styleId && fill.visible !== false && !isCommonColor(fill)
    )
    if (hasNonCommonHardcodedColor && node.type !== 'VECTOR' && node.type !== 'LINE') {
      return {
        severity: 'info',
        category: '색상 스타일',
        path: path,
        nodeId: nodeId,
        issue: '하드코딩된 색상 사용 (흰색/검은색 제외)',
        suggestion: 'Color Styles 적용 권장 (일관성 유지)',
      }
    }
  }
  return null
}

// 깊이 검증
function checkDepth(node, depth, path, nodeId) {
  if (depth > 5) {
    return {
      severity: 'warning',
      category: '레이어 깊이',
      path: path,
      nodeId: nodeId,
      depth: depth,
      issue: `레이어 깊이 ${depth} (권장: 3-4 depth)`,
      suggestion: '구조 단순화 필요 (불필요한 그룹핑 제거)',
    }
  }
  return null
}

// 노드 순회 및 검증
function checkNode(node, depth = 0, path = '') {
  const currentPath = path ? `${path} > ${node.name}` : node.name
  const nodeId = node.id

  // 각 항목 검증
  const namingIssue = checkNaming(node, currentPath, nodeId)
  if (namingIssue) issues.naming.push(namingIssue)

  const autoLayoutIssue = checkAutoLayout(node, currentPath, nodeId)
  if (autoLayoutIssue) issues.autoLayout.push(autoLayoutIssue)

  const colorIssue = checkColors(node, currentPath, nodeId)
  if (colorIssue) issues.hardcodedColors.push(colorIssue)

  const depthIssue = checkDepth(node, depth, currentPath, nodeId)
  if (depthIssue) issues.depth.push(depthIssue)

  // 자식 노드 순회
  if (node.children) {
    node.children.forEach((child) => checkNode(child, depth + 1, currentPath))
  }
}

// 페이지 선택
let targetPage
if (pageName) {
  targetPage = data.document.children.find((p) => p.name === pageName)
  if (!targetPage) {
    console.error(`페이지 "${pageName}"를 찾을 수 없습니다.`)
    console.error(`사용 가능한 페이지: ${data.document.children.map((p) => p.name).join(', ')}`)
    process.exit(1)
  }
} else {
  targetPage = data.document.children[0]
}

// 제외 페이지 체크
if (EXCLUDED_PAGES.some((excluded) => targetPage.name.includes(excluded))) {
  console.log(`\n⚠️  "${targetPage.name}" 페이지는 검증 대상이 아닙니다.`)
  console.log(`검증 대상: Sprint, Final, Dev 페이지만 검증합니다.\n`)
  console.log(`사용 가능한 페이지: ${data.document.children.map((p) => p.name).join(', ')}`)
  process.exit(0)
}

// 린트 실행
console.log(`\n📊 Figma 린트 검증 시작: ${targetPage.name}\n`)
checkNode(targetPage)

// 심각도 계산
function getSeverity(count) {
  if (count > 1000) return '🔴 높음'
  if (count > 100) return '🟡 중간'
  return '🟢 낮음'
}

// 총 이슈 수
const totalIssues =
  issues.naming.length +
  issues.autoLayout.length +
  issues.hardcodedColors.length +
  issues.depth.length

// 한글 보고서 생성
const report = `
# 📊 Figma 린트 검증 결과

**파일**: ${data.name}
**페이지**: ${targetPage.name}
**검증 일시**: ${new Date().toLocaleString('ko-KR')}

---

## 🎯 요약

| 항목 | 발견 | 심각도 |
|------|------|--------|
| 네이밍 | ${issues.naming.length}개 | ${getSeverity(issues.naming.length)} |
| Auto Layout | ${issues.autoLayout.length}개 | ${getSeverity(issues.autoLayout.length)} |
| 색상 스타일 | ${issues.hardcodedColors.length}개 | ${getSeverity(issues.hardcodedColors.length)} |
| 레이어 깊이 | ${issues.depth.length}개 | ${getSeverity(issues.depth.length)} |

**총 이슈**: ${totalIssues}개

---

## 📌 주요 개선 사항

### 1. 네이밍 (${issues.naming.length}개)

${
  issues.naming.length > 0
    ? `
#### ⚠️ 기본 이름 사용

**예시:**
${issues.naming
  .filter((i) => i.issue.includes('기본 이름'))
  .slice(0, 5)
  .map((i) => {
    const name = i.path.split(' > ').pop()
    const url = getFigmaUrl(i.nodeId)
    return `- [\`${name}\`](${url}) → 설명적인 이름 권장`
  })
  .join('\n')}

✅ **개선 방법**
- \`Frame 2147229913\` → \`NavigationBar\`
- \`Group 456\` → \`FilterButtonGroup\`
- Figma 플러그인 "Rename It" 활용
`
    : '✅ 이슈 없음'
}

---

### 2. Auto Layout (${issues.autoLayout.length}개)

${
  issues.autoLayout.length > 0
    ? `
Auto Layout 미적용 화면에서는 반응형 대응이 어렵습니다.

**해당 화면 (상위 ${Math.min(5, issues.autoLayout.length)}개):**
${issues.autoLayout
  .slice(0, 5)
  .map((i, idx) => {
    const name = i.path.split(' > ').slice(-2).join(' > ')
    const url = getFigmaUrl(i.nodeId)
    return `${idx + 1}. [\`${name}\`](${url})`
  })
  .join('\n')}

✅ **개선 방법**
1. 프레임 선택
2. \`Shift + A\` (Auto Layout 단축키)
3. Direction, Spacing 설정
`
    : '✅ 이슈 없음'
}

---

### 3. 색상 스타일 (${issues.hardcodedColors.length}개)

${
  issues.hardcodedColors.length > 0
    ? `
하드코딩된 색상은 디자인 일관성 유지가 어렵습니다.

**주요 영역 (상위 ${Math.min(5, issues.hardcodedColors.length)}개):**
${issues.hardcodedColors
  .slice(0, 5)
  .map((i, idx) => {
    const name = i.path.split(' > ').slice(-2).join(' > ')
    const url = getFigmaUrl(i.nodeId)
    return `${idx + 1}. [\`${name}\`](${url})`
  })
  .join('\n')}

✅ **개선 방법**
1. Select > Same Fill Color로 같은 색상 찾기
2. Design panel > Fill > Style 적용
3. Color Styles 미리 정의 권장:
   - Primary, Secondary
   - Text/Default, Text/Secondary, Text/Error
   - Background/Default, Background/Surface
`
    : '✅ 이슈 없음'
}

---

### 4. 레이어 깊이 (${issues.depth.length}개)

${
  issues.depth.length > 0
    ? `
레이어 깊이가 깊으면 유지보수가 어렵습니다.

**최대 깊이 (상위 ${Math.min(3, issues.depth.length)}개):**
${issues.depth
  .slice(0, 3)
  .map((i, idx) => {
    const name = i.path.split(' > ').slice(-3).join(' > ')
    const url = getFigmaUrl(i.nodeId)
    return `${idx + 1}. ${i.depth} depth - [\`${name}\`](${url})`
  })
  .join('\n')}

✅ **개선 방법**
- 불필요한 Frame/Group 제거
- 컴포넌트화로 구조 단순화
- StatusBar, Header 등 공통 요소는 별도 컴포넌트로 분리
`
    : '✅ 이슈 없음'
}

---

## 🎯 우선순위별 개선 작업

### 🔥 긴급 (개발 착수 전 필수)

${issues.depth.length > 500 ? '- 레이어 깊이 과도 초과 → 구조 단순화' : ''}
${issues.hardcodedColors.length > 500 ? '- Color Styles 미적용 → 일관성 확보' : ''}

### ⚠️ 높음 (스프린트 중 개선)

${issues.naming.filter((i) => i.issue.includes('기본 이름')).length > 50 ? '- 기본 이름 다수 사용 → 설명적 이름으로 변경' : ''}
${issues.autoLayout.length > 50 ? '- Auto Layout 미적용 화면 다수 → 점진적 적용' : ''}

### ✅ 중간 (점진적 개선)

- 네이밍 컨벤션 통일
- Text Styles 적용
- Spacing 표준화 (4px 배수)

---

## 💡 다음 단계

1. **긴급 이슈 우선 해결** (개발 전달 전)
2. **컴포넌트 공통화** (StatusBar, Header 등)
3. **Color/Text Styles 정의 및 적용**
4. **Auto Layout 점진적 적용**

---

## 📚 참고 자료

- [Figma Best Practices](https://www.figma.com/best-practices/)
- [Morton 네이밍 컨벤션](.claude/skills/figma-lint/SKILL.md)
- Figma 플러그인: Stark (접근성), Rename It (일괄 이름 변경)
`

console.log(report)

// 파일로 저장
const skillDir = path.dirname(__filename)
const outputPath = path.join(skillDir, 'figma-lint-report.md')
fs.writeFileSync(outputPath, report)
console.log(`\n📄 보고서 저장: ${outputPath}\n`)
