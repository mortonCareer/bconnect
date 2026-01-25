# Figma Lint [DEPRECATED]

> ⚠️ **이 스킬은 더 이상 사용되지 않습니다.**
>
> **중단 이유:** 디자이너의 작업 스타일(프레임 중첩, 레이어 구조 등)이 스킬에서 가정한 규칙과 달라서 현실적으로 사용이 어렵습니다.
>
> **대안:** 필요 시 Figma 플러그인 사용
>
> - Design Lint (디자인 일관성 검사)
> - Stark (접근성 검사)
> - Rename It (레이어 일괄 이름 변경)

---

Figma 디자인 파일의 품질을 검증하고 개선 사항을 제안하는 스킬입니다.

## 사용 방법

### Claude Code에서 (추천)

```
"Figma 린트해줘"
"피그마 린트 Sprint 1"
"Figma lint"
```

AI 에이전트가 자동으로:

1. Figma API로 파일 다운로드
2. 린트 검증 실행
3. 한글 보고서 생성

### 직접 실행 (개발자)

```bash
# 1. Figma 파일 다운로드
export FIGMA_ACCESS_TOKEN="your_token"
curl -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN" \
  "https://api.figma.com/v1/files/EFXofON7gTFbmbE2kB31SS" \
  -o /tmp/figma-file.json

# 2. 린트 실행
node .claude/skills/figma-lint/lint.cjs \
  --file /tmp/figma-file.json \
  --page "Sprint 1"

# 3. 결과 확인
cat /tmp/figma-lint-report.md
```

## 검증 대상 페이지

✅ **검증 O:**

- Sprint 페이지 (Sprint 1, Sprint 2 등)
- Final, Dev 등 완성본 페이지

❌ **검증 X:**

- 와이어프레임 (Wireframe)
- References & Drafts
- Assets & Design System

## 검증 항목

- **네이밍 컨벤션**: 화면명, 컴포넌트명, 기본 이름 사용 여부
- **Auto Layout**: 미적용 화면 체크
- **색상 스타일**: 하드코딩된 색상 (흰색/검은색 제외)
- **레이어 깊이**: 과도한 그룹핑 체크 (5 depth 이상)

## 보고서 형식

한글로 작성된 마크다운 보고서:

- 요약 테이블 (이슈 개수, 심각도)
- 우선순위별 분류 (긴급/높음/중간)
- 개선 예시 및 가이드

## 네이밍 Best Practice

### 화면 (한글 허용)

```
✅ 회원가입/본인인증-00-전화번호 입력
✅ 내정보/본인화면-01-소개
✅ 홈/피드-01
```

### 컴포넌트 (영문 권장)

```
✅ Header Container
✅ StatusBar
✅ Button, Input
```

### 기본 이름 (지양)

```
⚠️ Frame 2147229913 → NavigationBar
⚠️ Group 456 → FilterButtonGroup
```

## 상세 가이드

전체 가이드는 [SKILL.md](./SKILL.md) 참고
