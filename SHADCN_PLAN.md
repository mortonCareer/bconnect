# shadcn/ui 도입 계획

## 현재 상태

- [x] Phase 1 완료 (2024-01-10)
- [x] Phase 2 완료 (2024-01-10)
- [x] Phase 3 완료 (2024-01-10)

---

## Phase 1: 기반 세팅 ✅

- [x] 기존 Button 컴포넌트 삭제
- [x] shadcn 의존성 설치 (clsx, tailwind-merge, cva, radix-slot)
- [x] `cn()` 유틸 함수 추가 (`packages/ui/src/lib/utils.ts`)
- [x] globals.css에 shadcn CSS Variables 추가 (OKLCH)
- [x] Button 컴포넌트 추가 (`packages/ui/src/components/ui/button.tsx`)
- [x] 빌드 테스트 통과

---

## Phase 2: Claude 커맨드 + 파일명 컨벤션 ✅

### Claude 커맨드

- [x] `/add-component` - shadcn 컴포넌트 추가
- [x] `/figma-sync` - Figma MCP로 디자인 읽어서 코드 생성
- [x] `/design-tokens` - Figma Variables → CSS Variables

### 파일명 컨벤션

- [x] UpperCamelCase로 통일 (예: `Button.tsx`)

---

## Phase 3: 핵심 컴포넌트 추가 ✅

- [x] Input
- [x] Label
- [x] Card
- [x] Dialog
- [ ] Form (react-hook-form 연동) - 추후 필요시 추가

---

## Phase 4: Figma 연동 (MCP 기반)

### 워크플로우

```text
Figma → AI (MCP) → 코드 생성
```

### 설정

- [x] Figma MCP 연동 완료
- [x] 컴포넌트 매핑 파일 생성 (`packages/ui/figma-mapping.json`)

### 할 일

- [ ] 디자이너에게 shadcn Figma 라이브러리 공유
  - 링크: <https://www.figma.com/community/file/1342715840824755935>
- [ ] 디자이너가 컴포넌트 완성 시 개발자에게 Figma URL 전달 → 매핑 파일 업데이트
- [ ] Variables 커스터마이징 (브랜드 컬러 적용)
  - 현재: `color/red` (#FF4242) → `--primary`로 매핑 필요

### 사용법

1. 디자이너가 Figma 컴포넌트 URL 공유
2. 개발자가 `figma-mapping.json`에 URL 추가
3. `/figma-sync [컴포넌트명]` 또는 `/figma-sync [URL]` 실행
4. AI가 매핑 정보 기반으로 Figma 읽어서 코드 생성/수정

### 매핑 파일 구조

```json
{
  "components": {
    "Button": {
      "figmaUrl": "https://www.figma.com/design/xxx?node-id=123-456",
      "codePath": "src/components/ui/Button.tsx"
    }
  }
}
```

---

## Phase 5: 앱 마이그레이션

- [ ] career 앱에서 기존 컴포넌트 → shadcn 전환
- [ ] plan 앱에서 shadcn 컴포넌트 사용

---

## 파일 구조

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn 컴포넌트들
│   │   │   ├── Button.tsx ✅
│   │   │   ├── Input.tsx ✅
│   │   │   ├── Label.tsx ✅
│   │   │   ├── Card.tsx ✅
│   │   │   └── Dialog.tsx ✅
│   │   └── index.ts      # export
│   ├── lib/
│   │   └── utils.ts      # cn() 함수 ✅
│   └── styles/
│       └── globals.css   # CSS Variables ✅
├── figma-mapping.json    # Figma ↔ 코드 매핑 ✅
└── package.json
```

---

## shadcn Button variants

- `default` - 기본 (어두운 배경)
- `secondary` - 보조
- `destructive` - 삭제/위험
- `outline` - 테두리만
- `ghost` - 배경 없음
- `link` - 링크 스타일

## shadcn Button sizes

- `sm`, `default`, `lg`
- `icon`, `icon-sm`, `icon-lg`

---

## 참고 링크

- [shadcn/ui 공식](https://ui.shadcn.com)
- [Tailwind v4 문서](https://ui.shadcn.com/docs/tailwind-v4)
- [shadcn Figma 라이브러리](https://www.figma.com/community/file/1342715840824755935)
- [Figma-Claude 협업 문서](https://www.notion.so/2e4965d2888b81b1bcdfd77652824328)

---

## 메모

- Tailwind v4 + React 19 + Next.js 16 환경
- shadcn CLI를 packages/ui에서 실행 (components.json, tsconfig.json 추가)
- OKLCH 색상 포맷 사용 중
- CLI가 생성한 `src/lib/utils` import → 상대경로 `../../lib/utils`로 수정 필요
- **Code Connect 사용 안 함** - Figma MCP로 단방향(Figma → AI → 코드) 워크플로우 사용
