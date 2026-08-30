# ADR-0026: FE 에러 분기

- 상태: 승인됨
- 날짜: 2026-07-15
- 담당자: @twjin03, @manamana32321

## 개요

BE 응답은 `{ success, data | error }` envelope 형식이다. 근거는 [ADR-0004](0004-api-response-envelope.md)다. 에러는 `error` 객체에 세 값을 담는다:

```json
{
  "success": false,
  "error": { "code": "C005", "status": 404, "message": "요청한 리소스를 찾을 수 없습니다." }
}
```

- `code` (문자열): BE 애플리케이션 에러 코드. 도메인별 `*ExceptionCode` enum이 정의한다. `CommonExceptionCode.NOT_FOUND` = `C005`, `OfferExceptionCode.NOT_PROJECT_TASK` = `OF001` 등이다. BE 내부 명명 규칙이다.
- `status` (숫자): HTTP 상태 코드. `404`, `400`, `401` 등 프로토콜 표준.
- `message` (문자열): 사람이 읽는 한글 설명. FE는 이를 그대로 표기한다. passthrough 원칙이며 근거는 [ADR-0015](0015-be-code-as-api-ssot.md)다.

FE에선 `customFetch`가 envelope를 벗기며 에러를 `ApiError`로 변환해 TanStack Query로 던진다. 종전 `ApiError`는 `code`+`message`만 보유했다. HTTP status는 버려졌다.

`#852`(plan 공정표)에서 "없는 프로젝트 진입 시 안내 화면" 요구가 생기며 "이 에러가 not-found인가"를 FE가 판별해야 했다. 이때 무엇을 분기 기준으로 삼을지가 반복적으로 재검토됐다. 리뷰 3라운드를 거쳤다. 앞으로 모든 도메인의 에러 UX 분기에 동일한 질문이 재발하므로 원칙을 못박는다.

## 선택지

### 옵션 1: 항상 BE 에러 code 기준 (예: `code === 'C005'`)

장점

- 도메인 단위로 세밀하게 분기 가능. 같은 HTTP status라도 원인별로 다른 UX 가능.

단점

- FE가 BE 내부 enum 명명에 매직스트링으로 결합. BE가 코드를 개명하거나 `PJ001` 등 도메인 전용 코드를 신설하면 FE가 조용히 깨진다. 컴파일 에러도 없다. 코드 목록은 안정적 계약이 아니라 BE 구현 detail.

### 옵션 2: 항상 HTTP status 기준 (예: `status === 404`)

장점

- HTTP status는 표준·안정 계약. BE 내부 명명과 무관해 결합도 0. "리소스 없음/권한 없음/서버 오류"의 보편 신호.

단점

- 거칠다. 같은 `404`의 서로 다른 원인을 구분 못 함. 또 일부 앱 레벨 에러는 envelope 특성상 HTTP `200`에 `success:false`로 오므로 status만으론 못 잡는 경우가 존재.

### 옵션 3: 하이브리드. HTTP status 1차, 필요 시 code 2차

장점

- 안정적인 표준 status를 기본값으로 두어 결합을 피한다. 세분화가 꼭 필요한 소수 지점에서만 code로 2차 분기하는 escape hatch를 남긴다.

단점

- 분기 축이 둘이라 "언제 code까지 내려갈지" 판단 규율이 필요.

## 결정사항

하이브리드인 옵션 3 을 채택한다.

- 1차 분기는 HTTP `status`. not-found, 권한 없음, 서버 오류, 입력 오류 등 대부분의 에러 UX는 status만으로 충분하다. FE는 BE 내부 코드에 결합하지 않는다.
- 2차 분기는 `code`, 다음이 모두 성립할 때만 사용한다:
  1. 같은 HTTP status가 서로 다른 UX로 갈라져야 하고,
  2. 그 `code`가 실질적으로 안정적인 신호이며 자주 바뀌지 않고,
  3. status만으론 표현이 불가능하다. 앱 에러가 HTTP `200`+`success:false`로 오는 경우가 예시다. 이땐 status가 `200`이라 code가 유일 신호다.

이를 위해 `ApiError`에 원본 HTTP `status`를 실어준다. `customFetch`의 두 throw 지점이 `response.status`를 전달한다. HTTPError는 `error.response.status`를 쓴다. 기존 `code`+`message` 시그니처는 하위호환 유지. `status`는 optional 3번째 인자다.

`message`는 종전대로 BE passthrough다. 근거는 [ADR-0015](0015-be-code-as-api-ssot.md)다. 사람이 읽는 텍스트는 code/status 분기와 별개 축이다.

첫 적용은 #852다. plan 공정표 게이트가 `error.status === 404`면 "프로젝트를 찾을 수 없어요", 그 외 오류는 "프로젝트를 불러오지 못했어요"로 분기한다. code는 미사용이며 status만으로 충분하다.

## 기대 효과

- 좋은 결과:
  - 에러 UX 분기의 기본 규칙이 하나로 정해져 도메인마다 재논의하지 않는다.
  - status 기반이라 BE 에러 코드 개명·신설에 FE가 깨지지 않는다.
  - `ApiError.status`가 앱 전역에서 사용 가능해져 향후 에러 UX의 토대가 된다. 재시도 가능 여부, 4xx/5xx 구분 등이다.
- 나쁜 결과 / 리스크:
  - 앱 레벨 에러가 HTTP `200`+`success:false`로 오면 `status`가 `200`이라 status 분기가 무력하다. 이 경우 반드시 2차인 `code`로 내려가야 한다. 판단 규율을 지키지 않으면 놓칠 수 있다.
  - "언제 2차(code)까지 가는가"가 사람 판단이라 남용/과소 사용 여지가 있다. 위 3조건으로 제약한다.
- 중립적 결과:
  - `code`는 `ApiError`에 계속 보존한다. 2차 분기 경로와 디버깅/로깅에 쓰인다.
  - `401`/`403`은 별도 경로로 이미 처리된다. 해당 경로는 `customFetch` afterResponse 훅의 토큰 재발급이며 [ADR-0015](0015-be-code-as-api-ssot.md) 관련이다. 본 결정의 UX 분기와 층이 다르다.

## 메모

- 구현: `packages/api-client/src/client.ts` 에 `ApiError.status` + 두 throw 지점. `apps/plan/.../schedule/_components/schedule-content.tsx` 가 첫 적용.

## 참조

- #852
- PR #873
- [ADR-0004](0004-api-response-envelope.md)
- [ADR-0015](0015-be-code-as-api-ssot.md)
