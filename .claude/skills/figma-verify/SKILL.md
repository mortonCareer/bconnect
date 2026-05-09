# Figma Verify

Figma 디자인과 실제 렌더링된 컴포넌트를 시각적으로 비교하여 일치할 때까지 반복 수정합니다.

## 사용 시점

- 새로 생성한 컴포넌트가 Figma 디자인과 일치하는지 확인할 때
- 디자인 QA 과정에서 픽셀 퍼펙트 검증이 필요할 때
- 컴포넌트 수정 후 디자인 일관성을 확인할 때

---

## 워크플로우

### 1. Figma 스크린샷 획득

Figma MCP의 `get_screenshot` 도구를 사용하여 디자인 스크린샷을 가져옵니다.

```
mcp__figma__get_screenshot
- file_key: Figma 파일 키
- node_id: 비교할 노드 ID
```

### 2. 브라우저 스크린샷 자동 캡처

**Playwright CLI**를 사용하여 로컬 개발 서버의 스크린샷을 자동으로 캡처합니다.

```bash
# Playwright 설치 (최초 1회)
pnpm add -Dw playwright
npx playwright install chromium

# 스크린샷 캡처
npx playwright screenshot http://localhost:3000/figma-test/button screenshot.png
```

**Playwright 스크린샷 옵션:**

```bash
# 전체 페이지 캡처
npx playwright screenshot --full-page http://localhost:3000/page full.png

# 특정 viewport 크기로 캡처
npx playwright screenshot --viewport-size=360,50 http://localhost:3000/page viewport.png

# 특정 요소만 캡처 (selector 사용)
npx playwright screenshot --selector="button" http://localhost:3000/page button.png

# 다크 모드 시뮬레이션
npx playwright screenshot --color-scheme=dark http://localhost:3000/page dark.png

# 특정 기기 에뮬레이션
npx playwright screenshot --device="iPhone 13" http://localhost:3000/page mobile.png
```

### 3. 시각적 비교

두 스크린샷을 비교하여 차이점을 분석합니다.

**비교 항목:**

- 크기 (width, height)
- 색상 (배경, 텍스트, 테두리)
- 간격 (padding, margin, gap)
- 타이포그래피 (font-size, font-weight, line-height)
- 테두리 (border-radius, border-width)
- 정렬 (alignment, justify)

### 4. 수정 및 재검증

차이점이 발견되면:

1. 해당 스타일 속성 수정
2. 브라우저 새로고침 (자동 Hot Reload)
3. 새 스크린샷 캡처
4. 재비교
5. 일치할 때까지 반복

---

## 실행 예시

### 전체 플로우

```bash
# 1. 개발 서버 실행 중인지 확인
curl -s http://localhost:3000 > /dev/null && echo "Server running" || echo "Start server first"

# 2. Figma 스크린샷 (MCP 도구 사용)
# mcp__figma__get_screenshot 호출

# 3. 브라우저 스크린샷 캡처
npx playwright screenshot \
  --selector="[data-testid='button-primary']" \
  http://localhost:3000/figma-test/button \
  /tmp/browser-button.png

# 4. 두 이미지 비교 (Claude가 시각적으로 분석)
```

### Button 컴포넌트 검증 예시

**입력:**

```
Figma URL: https://www.figma.com/design/EFXofON7gTFbmbE2kB31SS/?node-id=187-607
컴포넌트: packages/ui/src/components/ui/Button.tsx
미리보기: http://localhost:3000/figma-test/button
```

**프로세스:**

1. Figma에서 Button 스크린샷 획득 (MCP)
2. Playwright로 /figma-test/button 페이지 스크린샷 캡처
3. 비교 분석:
   - 버튼 크기: 360x50 ✓
   - 배경색: #386DFF ✓
   - 텍스트 색상: white ✓
   - border-radius: 8px ✓
   - font-weight: semibold ✓
4. 결과: 일치 확인

### 차이점 발견 시

**비교 결과:**

```
❌ 차이점 발견:
- height: Figma 50px vs 렌더링 40px
- font-size: Figma 16px vs 렌더링 14px
```

**수정:**

```typescript
// Button.tsx 수정
size: {
  default: 'h-button-default w-button-default px-4 text-base', // text-sm → text-base
}
```

**재검증:**

```bash
# 스크린샷 다시 캡처
npx playwright screenshot http://localhost:3000/figma-test/button /tmp/browser-button.png
```

```
✓ 모든 항목 일치
```

---

## 설정

### Playwright 설치

```bash
# 프로젝트에 Playwright 추가
pnpm add -Dw playwright

# Chromium 브라우저 설치
npx playwright install chromium
```

### 테스트 페이지 설정

컴포넌트 검증을 위한 테스트 페이지에 `data-testid` 속성 추가:

```tsx
// figma-test/button/page.tsx
<Button data-testid="button-primary" variant="primary">다음</Button>
<Button data-testid="button-secondary" variant="secondary">다음</Button>
```

---

## 체크리스트

검증 시 확인해야 할 항목:

### 레이아웃

- [ ] 너비 (width)
- [ ] 높이 (height)
- [ ] 패딩 (padding)
- [ ] 마진 (margin)
- [ ] 갭 (gap)

### 색상

- [ ] 배경색 (background-color)
- [ ] 텍스트 색상 (color)
- [ ] 테두리 색상 (border-color)
- [ ] hover 상태 색상

### 타이포그래피

- [ ] 폰트 크기 (font-size)
- [ ] 폰트 두께 (font-weight)
- [ ] 줄 높이 (line-height)
- [ ] 글자 간격 (letter-spacing)

### 테두리 & 효과

- [ ] 테두리 반경 (border-radius)
- [ ] 테두리 두께 (border-width)
- [ ] 그림자 (box-shadow)

---

## 주의사항

### DO

- Figma 스크린샷과 동일한 viewport 크기에서 비교
- 모든 variant 상태 검증 (default, hover, disabled 등)
- 다양한 텍스트 길이로 테스트
- `data-testid` 사용하여 정확한 요소 선택

### DON'T

- 안티앨리어싱 차이를 버그로 간주하지 않기
- 1px 미만의 미세한 차이에 과도하게 집착하지 않기
- 브라우저별 렌더링 차이를 Figma 불일치로 오해하지 않기

---

## 참고

- [Playwright Test CLI](https://playwright.dev/docs/test-cli)
- [Playwright Screenshots](https://playwright.dev/docs/screenshots)
