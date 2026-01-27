# Figma to Tailwind 변환 규칙

Figma 디자인 속성을 Tailwind CSS 클래스로 변환하는 규칙입니다.

## 사용 시점

- Figma 디자인을 코드로 변환할 때
- 스타일 속성을 Tailwind 클래스로 매핑할 때

---

## Auto Layout → Flexbox

| Figma 속성                               | Tailwind          |
| ---------------------------------------- | ----------------- |
| `layoutMode: "HORIZONTAL"`               | `flex flex-row`   |
| `layoutMode: "VERTICAL"`                 | `flex flex-col`   |
| `primaryAxisAlignItems: "MIN"`           | `justify-start`   |
| `primaryAxisAlignItems: "CENTER"`        | `justify-center`  |
| `primaryAxisAlignItems: "MAX"`           | `justify-end`     |
| `primaryAxisAlignItems: "SPACE_BETWEEN"` | `justify-between` |
| `counterAxisAlignItems: "MIN"`           | `items-start`     |
| `counterAxisAlignItems: "CENTER"`        | `items-center`    |
| `counterAxisAlignItems: "MAX"`           | `items-end`       |

---

## 간격 (Gap, Padding)

### itemSpacing → gap

| Figma             | Tailwind                      |
| ----------------- | ----------------------------- |
| `itemSpacing: 0`  | `gap-0`                       |
| `itemSpacing: 4`  | `gap-1`                       |
| `itemSpacing: 8`  | `gap-2`                       |
| `itemSpacing: 12` | `gap-3`                       |
| `itemSpacing: 16` | `gap-4`                       |
| `itemSpacing: 20` | `gap-5`                       |
| `itemSpacing: 24` | `gap-6`                       |
| 기타              | `gap-[Npx]` (arbitrary value) |

### padding

| Figma                               | Tailwind                    |
| ----------------------------------- | --------------------------- |
| `paddingLeft: 16, paddingRight: 16` | `px-4`                      |
| `paddingTop: 8, paddingBottom: 8`   | `py-2`                      |
| 동일한 4방향                        | `p-N`                       |
| 기타                                | `p-[Npx]` (arbitrary value) |

---

## 색상 변환

Figma 색상 (RGBA 0-1)을 HEX로 변환 후 arbitrary value 사용:

```typescript
// Figma
fills: [{ color: { r: 0.22, g: 0.43, b: 1, a: 1 } }]

// 변환 공식
const toHex = (r: number, g: number, b: number) => {
  const hex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase()
}

// 결과
→ bg-[#386DFF]
```

### 색상 적용

| Figma 속성                   | Tailwind        |
| ---------------------------- | --------------- |
| `fills[0].color`             | `bg-[#HEX]`     |
| `strokes[0].color`           | `border-[#HEX]` |
| (TEXT 노드) `fills[0].color` | `text-[#HEX]`   |

### 투명도

| Figma                   | Tailwind       |
| ----------------------- | -------------- |
| `opacity: 0.5`          | `opacity-50`   |
| `fills[0].opacity: 0.5` | `bg-[#HEX]/50` |

---

## 크기 변환

### width, height

| Figma                         | Tailwind                              |
| ----------------------------- | ------------------------------------- |
| `width: 360`                  | `w-[360px]` 또는 `w-full` (부모 기준) |
| `height: 50`                  | `h-[50px]`                            |
| `width: "FILL"` (Auto Layout) | `w-full` 또는 `flex-1`                |
| `height: "HUG"` (Auto Layout) | `h-auto` (기본값, 생략 가능)          |

### 최소/최대 크기

| Figma           | Tailwind        |
| --------------- | --------------- |
| `minWidth: 200` | `min-w-[200px]` |
| `maxWidth: 400` | `max-w-[400px]` |

---

## 테두리 (Border)

### border-radius

| Figma                | Tailwind        |
| -------------------- | --------------- |
| `cornerRadius: 0`    | `rounded-none`  |
| `cornerRadius: 4`    | `rounded`       |
| `cornerRadius: 8`    | `rounded-lg`    |
| `cornerRadius: 12`   | `rounded-xl`    |
| `cornerRadius: 16`   | `rounded-2xl`   |
| `cornerRadius: 9999` | `rounded-full`  |
| 기타                 | `rounded-[Npx]` |

### border-width

| Figma             | Tailwind       |
| ----------------- | -------------- |
| `strokeWeight: 1` | `border`       |
| `strokeWeight: 2` | `border-2`     |
| 기타              | `border-[Npx]` |

---

## 타이포그래피

### font-size

| Figma          | Tailwind     |
| -------------- | ------------ |
| `fontSize: 12` | `text-xs`    |
| `fontSize: 14` | `text-sm`    |
| `fontSize: 16` | `text-base`  |
| `fontSize: 18` | `text-lg`    |
| `fontSize: 20` | `text-xl`    |
| `fontSize: 24` | `text-2xl`   |
| 기타           | `text-[Npx]` |

### font-weight

| Figma                          | Tailwind        |
| ------------------------------ | --------------- |
| `fontWeight: 400` / `Regular`  | `font-normal`   |
| `fontWeight: 500` / `Medium`   | `font-medium`   |
| `fontWeight: 600` / `SemiBold` | `font-semibold` |
| `fontWeight: 700` / `Bold`     | `font-bold`     |

### line-height

| Figma                    | Tailwind         |
| ------------------------ | ---------------- |
| `lineHeightPercent: 100` | `leading-none`   |
| `lineHeightPercent: 125` | `leading-tight`  |
| `lineHeightPercent: 150` | `leading-normal` |
| `lineHeightPercent: 160` | `leading-[1.6]`  |
| `lineHeightPercent: 200` | `leading-loose`  |

### text-align

| Figma                           | Tailwind      |
| ------------------------------- | ------------- |
| `textAlignHorizontal: "LEFT"`   | `text-left`   |
| `textAlignHorizontal: "CENTER"` | `text-center` |
| `textAlignHorizontal: "RIGHT"`  | `text-right`  |

---

## 그림자 (Shadow)

| Figma                          | Tailwind                                        |
| ------------------------------ | ----------------------------------------------- |
| `effects[type: "DROP_SHADOW"]` | `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg` |
| 복잡한 그림자                  | `shadow-[0_4px_6px_rgba(0,0,0,0.1)]`            |

---

## 실전 예시

### Figma Button 속성

```json
{
  "layoutMode": "HORIZONTAL",
  "primaryAxisAlignItems": "CENTER",
  "counterAxisAlignItems": "CENTER",
  "paddingLeft": 16,
  "paddingRight": 16,
  "paddingTop": 12,
  "paddingBottom": 12,
  "itemSpacing": 8,
  "cornerRadius": 8,
  "fills": [{ "color": { "r": 0.22, "g": 0.43, "b": 1 } }]
}
```

### 변환 결과

```tsx
<button className="flex flex-row items-center justify-center px-4 py-3 gap-2 rounded-lg bg-[#386DFF]">
  다음
</button>
```

---

## 참고

- [Tailwind CSS Spacing](https://tailwindcss.com/docs/customizing-spacing)
- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)
- [Figma Plugin API](https://www.figma.com/plugin-docs/)
