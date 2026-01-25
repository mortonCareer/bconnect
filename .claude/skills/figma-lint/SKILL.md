---
name: figma-lint
description: Figma 디자인 품질 검증. 네이밍 컨벤션, 컴포넌트 구조, 디자인 토큰 사용, 접근성 체크
allowed-tools: Bash, Read, Write, Grep
---

# Figma Lint

Figma 디자인 파일의 품질을 검증하고 개선 사항을 제안합니다.

## 사용 시점

- 디자인 시안 완성 후 개발 전달 전
- 디자인 시스템 일관성 검증
- 퍼블리싱 준비 확인

## 검증 대상 페이지

✅ **검증함:**

- Sprint 페이지 (Sprint 1, Sprint 2 등)
- Final, Dev 등 완성본 페이지

❌ **검증 안 함:**

- 와이어프레임 (Wireframe)
- References & Drafts
- Assets & Design System
- 레퍼런스 자료 페이지

**이유:** 초기 작업물이나 레퍼런스는 엄격한 규칙이 필요하지 않습니다.

---

## 검증 항목

### 1. 네이밍 컨벤션

#### 화면 (Screen/Page Frame)

✅ **권장 패턴**: `[기능]/[화면]-[순서]-[상태]`

**좋은 예:**

```
회원가입/본인인증-00-전화번호 입력
회원가입/ID입력-04-ID입력(에러)
내정보/본인화면-01-소개
홈/피드-01
```

**특징:**

- 한글 사용 가능 (화면명은 디자이너가 이해하기 쉽게)
- `/`로 기능 구분
- `-`로 순서와 상태 구분
- `()`로 세부 상태 표시

#### 컴포넌트/컨테이너

✅ **권장**: 영문 사용

**좋은 예:**

```
Header Container
Form Container
StatusBar
Button
Input
Navigation
```

**특징:**

- 영문 PascalCase 또는 Space 구분
- `Container` 접미사로 컨테이너 명시
- 재사용 가능한 이름

#### 기본 이름

⚠️ **지양**: Figma 자동 생성 이름

**개선 필요:**

```
Frame 2147229913 → NavigationBar
Group 456 → FilterButtonGroup
Rectangle 789 → Divider
```

✅ **권장**: 설명적인 이름으로 변경

### 2. 컴포넌트 구조

**Auto Layout:**

✅ **적용 권장:**

- 모든 레이아웃 프레임
- 간격이 일정한 요소들
- 반응형이 필요한 영역

⚠️ **사용 지양:**

- 절대 위치 (Absolute positioning) - 유지보수 어려움
- 하드코딩된 사이즈 - Auto Layout으로 대체 가능

**레이어 깊이:**

- 권장: 3-4 depth 이하
- 불필요한 그룹핑 최소화
- Flatten 가능한 Vector는 Flatten 처리 권장

**예시:**

```
✅ 좋은 구조:
Card
├─ Header
│  ├─ Title
│  └─ Icon
├─ Content
└─ Footer

❌ 나쁜 구조:
Card
└─ Group
    └─ Frame
        └─ Group
            └─ Frame
                └─ Header
```

### 3. 디자인 토큰 사용

**Color Styles:**

- ✅ Color Styles 사용 권장 (디자인 일관성 유지)
- ⚠️ 하드코딩된 색상 지양 (단, 흰색/검은색 제외)

**예시:**

```
Fill: #3B82F6 (파란색 하드코딩) → ⚠️ Color Style로 관리 권장
Fill: #FFFFFF (흰색) → ✅ 허용 (기본 색상)
Fill: #000000 (검은색) → ✅ 허용 (기본 색상)
Fill: Primary/Blue (Style) → ✅ 권장
```

**참고:** 흰색(`#FFFFFF`)과 검은색(`#000000`)은 워낙 자주 사용되므로 하드코딩을 허용합니다.

**Text Styles:**

- ✅ Text Styles 사용 권장 (타이포그래피 일관성)
- ⚠️ 직접 폰트/사이즈 지정 지양

**예시:**

```
Font: Inter 16px Bold (직접 지정) → ⚠️ 유지보수 어려움
Text Style: Heading/H3 (Style) → ✅ 권장
```

**Spacing:**

- ✅ 권장: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
- ⚠️ 지양: 임의의 값 (5px, 13px, 27px 등) - 일관성 저하

### 4. Variants 사용

**컴포넌트 상태 관리:**

Button 컴포넌트는 Variants로 상태 정의:

```
Properties:
- Variant: Primary, Secondary, Outline
- Size: Small, Medium, Large
- State: Default, Hover, Disabled
```

**권장 사항:**

- ✅ 관련 컴포넌트는 Variants로 묶기 (관리 편의성)
- ⚠️ 개별 컴포넌트로 분리 지양 (중복 발생)

### 5. 접근성 (Accessibility)

**색상 대비:**

- 텍스트와 배경 대비: 최소 4.5:1 (WCAG AA)
- 큰 텍스트 (18px+): 최소 3:1
- UI 요소 (버튼, 아이콘): 최소 3:1

**검증 예시:**

```
✅ 흰색 배경 (#FFFFFF) + 검은색 텍스트 (#000000) = 21:1
✅ 파란색 배경 (#3B82F6) + 흰색 텍스트 (#FFFFFF) = 8.6:1
⚠️ 연한 회색 배경 (#F3F4F6) + 회색 텍스트 (#9CA3AF) = 2.9:1 (개선 필요)
```

**폰트 크기:**

- 본문: 최소 14px (모바일), 16px (데스크톱)
- 버튼 레이블: 최소 14px
- 작은 텍스트 (캡션): 최소 12px

**터치 영역:**

- 모바일 버튼/링크: 최소 44x44px
- 아이콘 버튼: 최소 48x48px (padding 포함)

---

## AI 에이전트 실행 가이드

### 사용자가 "Figma 린트" 또는 "피그마 린트" 요청 시:

**Step 1: Figma 파일 정보 확인**

```bash
# .env에서 토큰 확인
cat .env | grep FIGMA_ACCESS_TOKEN

# figma-mapping.json에서 파일 키 추출
cat packages/ui/figma-mapping.json | jq -r '.pages | .[].figmaUrl' | head -1
# 파일 키: EFXofON7gTFbmbE2kB31SS
```

**Step 2: Figma API로 파일 다운로드**

```bash
curl -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN" \
  "https://api.figma.com/v1/files/EFXofON7gTFbmbE2kB31SS" \
  -o /tmp/figma-file.json 2>/dev/null
```

**Step 3: 린트 스크립트 실행**

```bash
node .claude/skills/figma-lint/lint.cjs \
  --file /tmp/figma-file.json \
  --page "Sprint 1"
```

**Step 4: 한글 보고서 출력**

- 마크다운 형식의 한글 보고서
- 우선순위별 이슈 분류 (긴급/높음/중간)
- 개선 예시 포함

---

## 검증 프로세스

### 자동 검증 (개발자용)

Figma API를 통해 자동으로 검증:

```bash
# Figma 파일 검증
figma-lint --file ABC123 --output lint-report.md
```

**검증 결과 예시:**

```markdown
## Figma Lint Report

### ❌ Errors (3)

1. **[Naming]** Frame 123
   - Location: Page 1 > Frame 123
   - Issue: 기본 이름 사용
   - Fix: 설명적인 이름으로 변경 (예: HeroSection)

2. **[Color]** Button background uses hex #3B82F6
   - Location: Components > Button/Primary
   - Issue: Color Style 미사용
   - Fix: Primary color style 적용

3. **[Accessibility]** Low contrast ratio 2.9:1
   - Location: Page 2 > Card > Text
   - Issue: WCAG AA 기준 미달 (최소 4.5:1 필요)
   - Fix: 텍스트 색상을 더 어둡게 조정

### ⚠️ Warnings (5)

1. **[Structure]** Layer depth 5 levels
   - Location: Page 1 > HeroSection
   - Issue: 권장 깊이(3-4) 초과
   - Suggestion: 불필요한 그룹핑 제거

2. **[Spacing]** Non-standard padding 13px
   - Location: Components > Card
   - Issue: 표준 간격(4px 배수) 미사용
   - Suggestion: 12px 또는 16px로 변경

### ✅ Passed (27)

- All components use Auto Layout
- Text styles applied consistently
- Component naming follows convention
- ...
```

### 수동 검증 체크리스트

디자이너가 개발 전달 전 확인:

#### 네이밍

- [ ] 모든 프레임/컴포넌트에 의미있는 이름 부여
- [ ] PascalCase 사용
- [ ] 영문만 사용 (한글 X)

#### 레이아웃

- [ ] Auto Layout 적용
- [ ] 절대 위치 사용 안 함
- [ ] 레이어 깊이 3-4 depth 이하

#### 스타일

- [ ] 모든 색상 Color Styles 사용
- [ ] 모든 텍스트 Text Styles 사용
- [ ] 간격 4px 배수 사용

#### 컴포넌트

- [ ] 재사용 가능한 요소 컴포넌트화
- [ ] Variants로 상태 정의
- [ ] Instance 사용 (복사 금지)

#### 접근성

- [ ] 색상 대비 4.5:1 이상
- [ ] 폰트 크기 최소 14px
- [ ] 터치 영역 44x44px 이상

---

## 문제 수정 가이드

### 1. 네이밍 일괄 변경

**Figma 플러그인 사용:**

- "Rename It" 플러그인 설치
- 규칙 적용: `{layer}/{variant}`
- 일괄 변경 실행

### 2. Color Styles 일괄 적용

1. 하드코딩된 색상 찾기:
   - Select > Same Fill Color
2. Color Style 적용:
   - Design panel > Fill > Style

### 3. Auto Layout 변환

1. 프레임 선택
2. `Shift + A` (Auto Layout 단축키)
3. Direction, Spacing, Padding 설정

### 4. 대비 개선

**색상 조정:**

- 텍스트 색상을 더 어둡게
- 또는 배경 색상을 더 밝게

**검증 도구:**

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Figma 플러그인: "Stark" (접근성 검사)

---

## Figma 플러그인

권장 플러그인:

| 플러그인        | 용도                    |
| --------------- | ----------------------- |
| **Stark**       | 접근성 검사 (색상 대비) |
| **Rename It**   | 레이어 일괄 이름 변경   |
| **Design Lint** | 디자인 일관성 검사      |
| **Auto Layout** | Auto Layout 자동 적용   |

---

## CI/CD 통합

GitHub Actions로 자동 검증:

```yaml
# .github/workflows/figma-lint.yml
name: Figma Lint

on:
  pull_request:
    paths:
      - 'docs/figma-links.md' # Figma 링크 변경 시

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Figma Lint
        env:
          FIGMA_ACCESS_TOKEN: ${{ secrets.FIGMA_ACCESS_TOKEN }}
        run: |
          node scripts/figma-lint.js
      - name: Comment PR
        uses: actions/github-script@v6
        with:
          script: |
            // lint-report.md 내용을 PR 댓글로 추가
```

---

## 주의사항

- **디자인 단계에서 검증**: 개발 전달 전 필수 검증
- **자동화 활용**: Figma API + CI/CD로 자동 검증
- **팀 규칙 준수**: 네이밍, 스타일 가이드 일관성 유지
- **접근성 우선**: WCAG 기준 준수

---

## 참고 문서

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Figma Best Practices](https://www.figma.com/best-practices/)
- [Design Systems Guide](https://www.designsystems.com/)
