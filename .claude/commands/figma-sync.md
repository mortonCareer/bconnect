# Figma 디자인 동기화

Figma 디자인을 코드로 변환합니다.

## 사용법

```
/figma-sync <figma-url>
```

예: `/figma-sync https://www.figma.com/design/xxx/File?node-id=1-2`

## 실행

1. `$ARGUMENTS`에서 Figma URL 파싱
   - fileKey와 nodeId 추출
2. Figma MCP `get_design_context` 도구로 디자인 정보 가져오기
3. 디자인 분석:
   - 컴포넌트 구조 파악
   - 사용된 Variables 확인
   - Auto Layout 설정 확인
4. 기존 shadcn 컴포넌트와 매칭 가능 여부 확인
5. 코드 생성 또는 수정 제안

## Figma MCP 도구

- `get_design_context`: 노드의 코드 컨텍스트 가져오기
- `get_screenshot`: 노드 스크린샷 가져오기
- `get_variable_defs`: Variables 정의 가져오기
- `get_metadata`: 노드 메타데이터 (구조) 가져오기

## URL 파싱 예시

```
https://www.figma.com/design/ABC123/FileName?node-id=1-2
                            ^^^^^^           ^^^
                            fileKey          nodeId (1:2로 변환)
```

## 참고

- [Figma-Claude 협업 문서](https://www.notion.so/2e4965d2888b81b1bcdfd77652824328)
- shadcn Figma 라이브러리와 연동 시 Code Connect 활용
