---
name: ready
description: |
  코드 품질 검증 및 빌드 테스트 수행.
  lint, format, build, test를 순차적으로 실행하여 코드 준비 상태를 확인.
allowed-tools:
  - Bash
---

# Ready Skill
커밋 이전에 반드시 실행해야 하는 코드 품질 검증 및 빌드 테스트를 수행합니다.

## 작업
다음 명령어를 순차적으로 실행합니다:

```bash
pnpm lint         # ESLint 검사
pnpm format       # Prettier 포맷팅
./gradlew build   # Gradle 빌드
./gradlew test    # Gradle 테스트
```

## 실행 방법
위 명령어들을 Bash 도구를 사용하여 순차적으로 실행하세요.
오류 발생 시 해당 단계에서 중단하고 문제를 해결합니다.
