# Figma 디자인 동기화

Figma 디자인을 읽어서 코드로 변환합니다.

## 사용법

```bash
/figma-sync <컴포넌트명 | Figma URL>
```

예:

- `/figma-sync Button` - 매핑 파일에서 URL 조회 후 동기화
- `/figma-sync https://www.figma.com/design/xxx?node-id=1-2` - URL 직접 지정

## 실행

### 1. 입력 파싱

`$ARGUMENTS` 확인:

- URL이면 → fileKey, nodeId 추출
- 컴포넌트명이면 → `packages/ui/figma-mapping.json`에서 URL 조회

### 2. 매핑 파일 확인

```json
// packages/ui/figma-mapping.json
{
  "components": {
    "Button": {
      "figmaUrl": "https://www.figma.com/design/xxx?node-id=123-456",
      "codePath": "src/components/ui/Button.tsx"
    }
  }
}
```

- `figmaUrl`이 null이면 → "Figma URL이 등록되지 않았습니다" 안내
- URL 직접 입력 시 → 매핑 파일에 URL 자동 추가 여부 확인

### 3. Figma MCP로 디자인 읽기

```
get_design_context(fileKey, nodeId)
```

### 4. 디자인 분석

- 컴포넌트 구조 파악
- 사용된 Variables 확인
- variant/state 정보 확인

### 5. 코드 생성/수정

- `codePath`에 해당하는 파일 읽기
- 디자인에 맞게 스타일/구조 수정
- 변경 사항 설명

## Figma MCP 도구

- `get_design_context`: 노드의 코드 컨텍스트 가져오기
- `get_screenshot`: 노드 스크린샷 가져오기
- `get_variable_defs`: Variables 정의 가져오기
- `get_metadata`: 노드 메타데이터 (구조) 가져오기

## URL 파싱

```text
https://www.figma.com/design/ABC123/FileName?node-id=1-2
                            ^^^^^^           ^^^
                            fileKey          nodeId (1:2로 변환)
```

## 참고

- 매핑 파일: `packages/ui/figma-mapping.json`
- SHADCN_PLAN.md에서 전체 워크플로우 확인
