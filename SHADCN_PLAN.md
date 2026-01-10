# shadcn/ui 도입 계획

## 현재 상태

- [x] Phase 1 완료 (2024-01-10)
- [x] Phase 2 완료 (2024-01-10)

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
- [x] `/figma-sync` - Figma 디자인 동기화
- [x] `/design-tokens` - Figma Variables → CSS Variables
- [x] `/code-connect` - Figma Code Connect 매핑

### 파일명 컨벤션

- [x] UpperCamelCase로 통일 (예: `Button.tsx`)

---

## Phase 3: 핵심 컴포넌트 추가

- [ ] Input
- [ ] Card
- [ ] Form (react-hook-form 연동)
- [ ] Label
- [ ] Dialog/Modal

---

## Phase 4: Figma 연동

- [ ] 디자이너에게 shadcn Figma 라이브러리 공유
  - 링크: <https://www.figma.com/community/file/1342715840824755935>
- [ ] Code Connect 매핑 파일 작성 (Button.figma.tsx 등)
- [ ] Variables 커스터마이징 (브랜드 컬러 적용)
  - 현재: `color/red` (#FF4242) → `--primary`로 매핑 필요

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
│   │   │   └── Button.tsx ✅
│   │   └── index.ts      # export
│   ├── lib/
│   │   └── utils.ts      # cn() 함수 ✅
│   └── styles/
│       └── globals.css   # CSS Variables ✅
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
- shadcn CLI가 모노레포 인식 못해서 수동 설정함
- OKLCH 색상 포맷 사용 중
