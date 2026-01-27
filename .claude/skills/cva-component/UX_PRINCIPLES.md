# UX 인터랙션 원칙

컴포넌트 생성 시 적용해야 하는 UX 원칙입니다.

---

## 1. Don Norman의 디자인 원칙

### Affordance (행동유도성)

물체가 "어떻게 사용되는지" 시각적으로 암시합니다.

```css
/* 버튼이 클릭 가능함을 암시 */
cursor-pointer
```

### Feedback (피드백)

모든 사용자 액션에는 즉각적인 반응이 있어야 합니다.

- 반응 없음 → "작동했나?" 불확실성 → 재클릭 → 중복 요청
- Nielsen Norman Group 연구: 피드백 없는 버튼은 사용자 신뢰도 40% 하락

### Mapping (대응)

실제 세계와 디지털의 연결입니다.

- 물리 버튼 누르면 들어감 → `scale-down` 효과
- 직관적 이해 가능

---

## 2. 반응 시간 심리학 (Jakob Nielsen)

| 시간       | 사용자 인식          |
| ---------- | -------------------- |
| 0-100ms    | 즉각적 (이상적)      |
| 100-300ms  | 자연스러움           |
| 300-1000ms | 처리 중 인지         |
| 1000ms+    | 로딩 인디케이터 필요 |

**권장:** Tailwind `transition-all` 기본값 150ms 사용

---

## 3. Fitts's Law (피츠의 법칙)

```
T = a + b × log₂(D/W + 1)
```

- T: 도달 시간
- D: 타겟까지 거리
- W: 타겟 크기

**적용:**

- 버튼 최소 크기: 44x44px (Apple HIG)
- 클릭 영역 = 시각적 영역 (패딩으로 확장 가능)

---

## 4. 버튼 상태별 피드백

```
Default → Hover → Active → Focus
   ↓        ↓        ↓        ↓
  기본    마우스    클릭중   키보드
  상태    올림      누름     포커스
```

### 필수 구현 항목

| 상태           | Tailwind 클래스                                   | 설명                  |
| -------------- | ------------------------------------------------- | --------------------- |
| Default        | 기본 스타일                                       | 초기 상태             |
| Hover          | `hover:bg-[darker]`                               | 마우스 올림           |
| Active         | `active:scale-[0.98]`                             | 클릭 중 (누르는 느낌) |
| Focus (키보드) | `focus-visible:ring-2 focus-visible:ring-[color]` | 키보드 탐색           |
| Disabled       | `disabled:opacity-50 disabled:cursor-not-allowed` | 비활성 상태           |

### Active 스케일 값 가이드

| 값   | 느낌                        |
| ---- | --------------------------- |
| 0.95 | 과장됨                      |
| 0.98 | 미묘하지만 인지 가능 (권장) |
| 0.99 | 거의 안 보임                |

---

## 5. Focus vs Focus-visible

```css
/* focus - 모든 포커스에 링 표시 */
/* 마우스 클릭해도 링이 남아있음 (권장하지 않음) */

/* focus-visible - 키보드 포커스만 */
/* 클릭 후 다른 곳 클릭하면 링 사라짐 (권장) */
```

**원칙:**

- 마우스 사용자: `active:scale` 피드백
- 키보드 사용자: `focus-visible:ring` 피드백
- 분리하는 것이 Apple HIG, Material Design 표준

---

## 6. 접근성 (A11y) 체크리스트

### 필수

- [ ] `cursor-pointer` - 클릭 가능 표시
- [ ] `focus-visible:ring` - 키보드 포커스 표시
- [ ] `disabled:cursor-not-allowed` - 비활성 상태 표시
- [ ] 충분한 색상 대비 (WCAG AA: 4.5:1)

### 권장

- [ ] `active:scale-[0.98]` - 클릭 피드백
- [ ] `transition-all` - 부드러운 전환
- [ ] `aria-label` - 스크린 리더 지원 (아이콘 버튼)

---

## 7. 컴포넌트별 적용 예시

### Button

```tsx
const buttonVariants = cva(
  // 기본 (Affordance)
  'cursor-pointer ' +
  // 전환 (반응 시간)
  'transition-all ' +
  // 포커스 (접근성)
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[brand] focus-visible:ring-offset-2 ' +
  // 클릭 (Feedback)
  'active:scale-[0.98] ' +
  // 비활성 (상태)
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  { ... }
)
```

### Input

```tsx
// 포커스 시 테두리 강조
'focus:border-[brand] focus:ring-1 focus:ring-[brand]'
// 에러 상태
'aria-invalid:border-red-500'
```

### Card (클릭 가능한 경우)

```tsx
'cursor-pointer hover:shadow-md active:scale-[0.99] transition-all'
```

---

## 8. 참고 자료

- [Don Norman - The Design of Everyday Things](https://www.nngroup.com/books/design-everyday-things-revised/)
- [Nielsen Norman Group - Response Times](https://www.nngroup.com/articles/response-times-3-important-limits/)
- [Fitts's Law](https://www.interaction-design.org/literature/topics/fitts-law)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design](https://m3.material.io/)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
