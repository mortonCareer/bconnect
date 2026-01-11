# Figma 페이지 디자인 동기화 (Deprecated)

> **이 커맨드는 두 개로 분리되었습니다:**
>
> 1. `/figma-generate` - Figma → Raw 코드 생성
> 2. `/figma-refactor` - 프로젝트 컨벤션 적용

## 권장 워크플로우

```bash
# 1단계: Raw 코드 생성
/figma-generate 회원가입/인증

# 2단계: 프로젝트 스타일 적용
/figma-refactor 회원가입/인증
```

## 왜 분리했나요?

| 기존 방식         | 새 방식               |
| ----------------- | --------------------- |
| 한 번에 모든 작업 | 단계별 실행           |
| AI 판단에 의존    | 명확한 규칙 적용      |
| 검토 어려움       | 중간 결과물 확인 가능 |

## 참고

- `/figma-generate` - Figma 디자인 1:1 코드화
- `/figma-refactor` - 리팩터링 규칙 적용
- `/figma-lint` - 코드 품질 검사
