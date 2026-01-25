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

---

## 검증 항목

### 1. 네이밍 컨벤션

**프레임/컴포넌트 이름:**

✅ **좋은 예:**

```
Button/Primary
Button/Secondary
Card/Default
Card/Highlighted
Icon/Close
Icon/Menu
```

❌ **나쁜 예:**

```
button1
버튼 (한글)
btn-primary (케밥케이스)
BUTTON_PRIMARY (스네이크케이스)
Frame 123 (기본 이름)
```

**규칙:**

- PascalCase 사용 (`Button`, `CardHeader`)
- `/`로 계층 구분 (`Button/Primary`, `Icon/Close`)
- 영문만 사용 (한글, 특수문자 금지)
- 설명적인 이름 (`Frame 1` → `HeroSection`)

### 2. 컴포넌트 구조

**Auto Layout 사용:**

✅ **필수 사용:**

- 모든 레이아웃 프레임
- 간격이 일정한 요소들
- 반응형이 필요한 영역

❌ **사용 금지:**

- 절대 위치 (Absolute positioning)
- 하드코딩된 사이즈 (Auto Layout으로 해결 가능한 경우)

**깊이 제한:**

- 최대 레이어 깊이: 3-4 depth
- 불필요한 그룹핑 제거
- Flatten 가능한 Vector는 Flatten 처리

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

- ✅ 모든 색상은 Color Styles 사용
- ❌ 하드코딩된 Hex 코드 금지

**검증:**

```
Fill: #000000 (하드코딩) → ❌
Fill: Text/Primary (Style) → ✅
```

**Text Styles:**

- ✅ 모든 텍스트는 Text Styles 사용
- ❌ 직접 폰트/사이즈 지정 금지

**검증:**

```
Font: Inter 16px Bold (직접 지정) → ❌
Text Style: Heading/H3 (Style) → ✅
```

**Spacing:**

- ✅ 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
- ❌ 임의의 값 (5px, 13px, 27px 등)

### 4. Variants 사용

**컴포넌트 상태 관리:**

Button 컴포넌트는 Variants로 상태 정의:

```
Properties:
- Variant: Primary, Secondary, Outline
- Size: Small, Medium, Large
- State: Default, Hover, Disabled
```

**검증:**

- ✅ 관련 컴포넌트는 Variants로 묶음
- ❌ 개별 컴포넌트로 분리

### 5. 접근성 (Accessibility)

**색상 대비:**

- 텍스트와 배경 대비: 최소 4.5:1 (WCAG AA)
- 큰 텍스트 (18px+): 최소 3:1
- UI 요소 (버튼, 아이콘): 최소 3:1

**검증 예시:**

```
✅ 흰색 배경 (#FFFFFF) + 검은색 텍스트 (#000000) = 21:1
✅ 파란색 배경 (#3B82F6) + 흰색 텍스트 (#FFFFFF) = 8.6:1
❌ 연한 회색 배경 (#F3F4F6) + 회색 텍스트 (#9CA3AF) = 2.9:1 (불합격)
```

**폰트 크기:**

- 본문: 최소 14px (모바일), 16px (데스크톱)
- 버튼 레이블: 최소 14px
- 작은 텍스트 (캡션): 최소 12px

**터치 영역:**

- 모바일 버튼/링크: 최소 44x44px
- 아이콘 버튼: 최소 48x48px (padding 포함)

---

## 검증 프로세스

### 자동 검증

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
