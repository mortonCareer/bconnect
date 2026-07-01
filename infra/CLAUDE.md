# 환경 네이밍 키워드

우리가 **정의/소유**하는 환경 키워드는 항상 축약형 정규값만 사용한다:

| 환경     | 정규 키워드 |
| -------- | ----------- |
| 프로덕션 | `prod`      |
| 프리뷰   | `preview`   |
| 개발     | `dev`       |

Railway 환경명, `SENTRY_ENVIRONMENT`, 리소스 라벨 등 **우리가 값을 정하는 곳**에 적용. `production`·`development` 풀네임으로 새로 적지 말 것.

**예외**: 외부 플랫폼이 강제하는 값(Vercel `vercel_project_environment_variable.target`, `NODE_ENV`, `NEXT_PUBLIC_VERCEL_ENV`)은 `production`/`development` literal 만 허용 — 축약하면 깨지니 그대로 둔다.
