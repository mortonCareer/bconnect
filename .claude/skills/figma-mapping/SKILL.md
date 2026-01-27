# Figma Mapping 관리

`figma-mapping.json` 스키마 및 업데이트 규칙입니다.

## 사용 시점

- 새 컴포넌트/페이지 생성 후 매핑 등록 시
- Figma 디자인과 코드의 동기화 상태 관리 시

---

## 파일 위치

```text
packages/ui/figma-mapping.json
```

---

## JSON 스키마

```json
{
  "description": "Figma 컴포넌트 & 페이지 ↔ 코드 매핑 (개발자 관리)",
  "components": {
    "ComponentName": {
      /* 컴포넌트 엔트리 */
    }
  },
  "pages": {
    "feature/step": {
      /* 페이지 엔트리 */
    }
  }
}
```

---

## 컴포넌트 엔트리 구조

```json
{
  "Tag": {
    "figmaUrl": "https://www.figma.com/design/FILE_KEY?node-id=NODE-ID",
    "codePath": "src/components/ui/Tag.tsx",
    "createdAt": "2026-01-27",
    "lastSyncedAt": "2026-01-27",
    "variants": [
      { "name": "default", "nodeId": "188-1005", "description": "기본 스타일" },
      { "name": "selected", "nodeId": "188-1011", "description": "선택된 상태" },
      { "name": "filter", "nodeId": "352-3876", "description": "필터 삭제 (X 아이콘)" }
    ]
  }
}
```

### 컴포넌트 필드 설명

| 필드           | 타입   | 필수 | 설명                                        |
| -------------- | ------ | ---- | ------------------------------------------- |
| `figmaUrl`     | string | O    | Figma 디자인 URL                            |
| `codePath`     | string | O    | 코드 파일 경로 (packages/ui 기준 상대 경로) |
| `createdAt`    | string | O    | 최초 생성 날짜 (YYYY-MM-DD)                 |
| `lastSyncedAt` | string | O    | 마지막 동기화 날짜                          |
| `variants`     | array  | -    | variant별 Figma 노드 매핑                   |

### variants 배열 요소

| 필드          | 타입   | 설명                                      |
| ------------- | ------ | ----------------------------------------- |
| `name`        | string | CVA variant 이름 (default, primary, etc.) |
| `nodeId`      | string | Figma 노드 ID (하이픈 형식: 188-1005)     |
| `description` | string | variant 설명                              |

---

## 페이지 엔트리 구조

```json
{
  "signup/profile": {
    "figmaUrl": "https://www.figma.com/design/FILE_KEY?node-id=NODE-ID",
    "codePath": "apps/career/src/app/signup/profile/page.tsx",
    "createdAt": "2026-01-27",
    "lastSyncedAt": "2026-01-27",
    "states": [
      { "name": "default", "nodeId": "574-4554" },
      { "name": "error", "nodeId": "574-4560" },
      { "name": "loading", "nodeId": "574-4570" }
    ]
  }
}
```

### 페이지 필드 설명

| 필드           | 타입   | 필수 | 설명                                |
| -------------- | ------ | ---- | ----------------------------------- |
| `figmaUrl`     | string | O    | Figma 디자인 URL                    |
| `codePath`     | string | O    | 코드 파일 경로 (프로젝트 루트 기준) |
| `createdAt`    | string | O    | 최초 생성 날짜                      |
| `lastSyncedAt` | string | O    | 마지막 동기화 날짜                  |
| `states`       | array  | -    | UI 상태별 Figma 노드 매핑           |

### states 배열 요소

| 필드     | 타입   | 설명                                      |
| -------- | ------ | ----------------------------------------- |
| `name`   | string | 상태 이름 (default, error, loading, etc.) |
| `nodeId` | string | Figma 노드 ID                             |

---

## 날짜 필드 규칙

### createdAt

- **설명**: 최초 동기화 시각
- **형식**: YYYY-MM-DD
- **업데이트**: 최초 생성 시에만 설정, 이후 변경 없음

### lastSyncedAt

- **설명**: 마지막 동기화 시각
- **형식**: YYYY-MM-DD
- **업데이트**: 재동기화 시마다 현재 날짜로 갱신

```javascript
// 날짜 생성
const today = new Date().toISOString().split('T')[0] // "2026-01-27"
```

---

## 업데이트 시나리오

### 1. 새 컴포넌트 생성

```json
// 추가할 엔트리
"NewComponent": {
  "figmaUrl": "https://www.figma.com/design/xxx?node-id=123-456",
  "codePath": "src/components/ui/NewComponent.tsx",
  "createdAt": "2026-01-27",
  "lastSyncedAt": "2026-01-27",
  "variants": [
    { "name": "default", "nodeId": "123-456", "description": "기본" }
  ]
}
```

### 2. 새 페이지 생성

```json
// pages에 추가
"feature/step": {
  "figmaUrl": "https://www.figma.com/design/xxx?node-id=789-012",
  "codePath": "apps/career/src/app/feature/step/page.tsx",
  "createdAt": "2026-01-27",
  "lastSyncedAt": "2026-01-27",
  "states": [
    { "name": "default", "nodeId": "789-012" }
  ]
}
```

### 3. 기존 컴포넌트 재동기화

```json
// 변경 전
"Tag": {
  "figmaUrl": "...",
  "codePath": "...",
  "createdAt": "2026-01-20",
  "lastSyncedAt": "2026-01-20",
  "variants": [...]
}

// 변경 후 (lastSyncedAt만 업데이트)
"Tag": {
  "figmaUrl": "...",
  "codePath": "...",
  "createdAt": "2026-01-20",      // 유지
  "lastSyncedAt": "2026-01-27",   // 갱신
  "variants": [...]
}
```

### 4. variant 추가

기존 컴포넌트에 새 variant 추가 시:

```json
"variants": [
  { "name": "default", "nodeId": "188-1005", "description": "기본" },
  { "name": "selected", "nodeId": "188-1011", "description": "선택됨" },
  // 새로 추가
  { "name": "disabled", "nodeId": "188-1020", "description": "비활성" }
]
```

---

## Node ID 형식

### Figma URL에서 추출

```text
URL: https://www.figma.com/design/xxx?node-id=574-4554
Node ID: 574-4554 (하이픈 형식 그대로 사용)
```

### API 호출 시

```text
Node ID: 574:4554 (콜론 형식으로 변환)
```

---

## 참조

- 매핑 파일: `packages/ui/figma-mapping.json`
- 관련 스킬: [figma-tailwind](../figma-tailwind/SKILL.md)
