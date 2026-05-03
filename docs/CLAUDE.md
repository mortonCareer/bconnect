# docs/

문서를 작성하는 방법에 대한 규칙

## 외부 도구 SSoT 룰

[`TOOLS.md`](TOOLS.md)가 모든 외부 SaaS/클라우드/라이브러리의 **단일 진실**입니다. 다른 docs/ 파일에서 외부 도구를 언급할 때:

- **간단 언급**: 그냥 도구명만 ("Vercel 프리뷰 배포" 정도)
- **자세한 설명 필요**: `→ [TOOLS.md](TOOLS.md)` 참조 링크
- **계정/URL/설정 정보 중복 금지**: TOOLS.md에서만 관리

신규 외부 도구 도입 시 TOOLS.md 먼저 갱신 → 그 후 다른 docs에서 사용.

## 다른 룰

- Notion 개발 문서DB vs Git 관리 `docs/*` 문서: 최신 상태를 반영하거나 Claude Code가 자주 접근하면 Git 관리, 접근 빈도 낮고 과거 결정이라면 Notion 개발 문서DB에 저장
