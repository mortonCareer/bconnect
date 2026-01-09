# 의존성 동기화

프로젝트 의존성을 동기화하고 정리합니다.

## 실행

1. `pnpm install` - 의존성 설치
2. 변경사항 확인 (`git status`)
3. `pnpm-lock.yaml` 변경 있으면 알림
4. 빌드 테스트 필요 여부 확인

## 옵션

- `$ARGUMENTS`가 `--clean`이면:
  1. `node_modules` 삭제
  2. `pnpm store prune`
  3. `pnpm install`

- `$ARGUMENTS`가 `--check`이면:
  1. `pnpm install --frozen-lockfile`로 lockfile 검증만

## 관련 파일

- `pnpm-workspace.yaml` - 워크스페이스 설정
- `package.json` (root) - 루트 의존성
- `apps/*/package.json` - 앱별 의존성
- `packages/*/package.json` - 패키지별 의존성
