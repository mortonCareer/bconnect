# ADR-0016: 환경·서비스 도메인 네이밍

- 상태: 승인됨
- 날짜: 2026-06-01
- 담당자: @fine-pine, @manamana32321

## 개요

[ADR-0009](0009-be-db-hosting-railway-staging.md)/[ADR-0010](0010-dev-branch-staging-be.md) 으로 dev(staging) 환경이 생기면서 FE(career·plan) + BE(api) 가 안정적이고 예측 가능한 도메인을 가져야 한다. 현재 dev 는 Vercel/Railway 자동생성 URL(`morton-career-env-dev-*.vercel.app`, `morton-api-dev.up.railway.app`) 을 쓰는데:

- 비일관: 서비스·플랫폼마다 형태가 제각각 (`morton-*-env-dev` vs `morton-api-dev`)
- 다운스트림 결합: [#352](https://github.com/mortonCareer/bconnect/issues/352) 의 `dev_api_url` 이 Railway 생성 도메인에 하드 결합. 플랫폼 URL 형태가 바뀌면 깨짐
- 확장성: 향후 환경(또 다른 staging, 프리뷰 채널 등)이나 서비스가 늘 때 규칙이 없음

production 도메인은 이미 자리잡았다: career=apex `bconnect.to`, plan=`plan.bconnect.to`, api=`api.bconnect.to`. dev 도메인도 이와 연속적인 규칙으로 정의해, 사람이 URL만 보고 "어느 서비스 / 어느 환경"인지 즉시 알 수 있어야 한다.

## 선택지

### 옵션 1: `{service}.{env}.bconnect.to` (production 은 env 생략)

production 은 `{service}.bconnect.to`, 비-production 환경은 service 와 apex 사이에 환경 라벨을 삽입. career 는 apex 서비스라 `{service}` 가 빈 형태.

장점

- production 도메인이 기존 그대로 불변, 환경 라벨이 apex 바로 앞이라 "환경"이 도메인 계층에서 명확, 서비스·환경 추가 시 규칙 그대로 확장

단점

- apex 서비스인 career 는 `{service}` 가 비어 dev 가 `dev.bconnect.to` 가 된다. 패턴의 미세한 예외다. `plan.dev.bconnect.to` 는 2-레벨 서브도메인이라 와일드카드 TLS/CORS 에 주의 필요

### 옵션 2: `{env}-{service}.bconnect.to`

환경을 prefix 로 (`dev-api.bconnect.to`, `dev-plan.bconnect.to`, career dev = `dev.bconnect.to`).

장점

- 모두 1-레벨 서브도메인 → `*.bconnect.to` 와일드카드 하나로 TLS/CORS 커버

단점

- production 과 형태 단절(`api.bconnect.to` ↔ `dev-api.bconnect.to`), 환경·서비스가 하이픈으로 평면화돼 계층 의미 약함, 서비스명에 하이픈 들어가면 모호

### 옵션 3: 자동생성 URL 유지 (커스텀 도메인 없음)

장점

- 작업 0

단점

- 위 개요 의 비일관·결합·확장성 문제 그대로

## 결정사항

옵션 1 을 채택한다.

| service     | production         | dev                    |
| ----------- | ------------------ | ---------------------- |
| career (FE) | `bconnect.to`      | `dev.bconnect.to`      |
| plan (FE)   | `plan.bconnect.to` | `plan.dev.bconnect.to` |
| api (BE)    | `api.bconnect.to`  | `api.dev.bconnect.to`  |

규칙: `{service}.{env}.bconnect.to`, production 은 `{env}` 생략, career 는 apex 서비스라 `{service}` 생략. 새 환경(`<env>`)·새 서비스(`<service>`)는 같은 규칙으로 확장한다.

production 도메인을 손대지 않는 연속성과, 환경이 apex 앞에 오는 계층 명확성을 우선시했다. 옵션 2 의 와일드카드 단순함보다 production-연속성·가독성을 택했고, 그 대가로 2-레벨 서브도메인(`plan.dev.bconnect.to`)에 대한 와일드카드 처리 부담을 받아들인다.

## 기대 효과

- 좋은 결과: URL 만으로 서비스·환경 식별 가능. production 도메인 불변. `dev_api_url`(#352)을 안정 도메인(`https://api.dev.bconnect.to`)으로 고정 가능. 환경/서비스 확장이 규칙적.
- 나쁜 결과:
  - `plan.dev.bconnect.to`·`api.dev.bconnect.to` 는 2-레벨 서브도메인이다. BE CORS 의 1-레벨 패턴 `https://*.bconnect.to` 가 매칭 못 할 수 있어 `https://*.dev.bconnect.to` 추가가 필요하다. BE 후속 작업이다. TLS 는 Vercel/Railway 가 자동 발급하므로 영향 없다.
  - career 의 apex 특수성으로 `{service}` 생략이 패턴의 예외다. 신규 합류자에게 본 ADR 로 설명한다.
- 중립적 결과: DNS 는 가비아(Gabia)에서 수동 관리한다. 가비아는 Terraform/CLI 를 지원하지 않아 DNS 레코드는 IaC 불가다. TF 는 Vercel `vercel_project_domain`(custom_environment_id) + Railway `railway_custom_domain`(environment_id=dev) 까지 선언하고, 그 후 노출되는 CNAME 타겟을 가비아 콘솔에서 수동 등록한다. 안정 도메인이라도 "그 환경의 최신 배포"에 alias 되므로, dev push 자동배포([#437](https://github.com/mortonCareer/bconnect/issues/437))가 동작해야 도메인이 최신을 가리킨다.

## 메모

- 현재 도메인 현황표(이 규칙의 적용 결과): 도메인 현황 (deprecated)
- 구현·체크리스트: [#438](https://github.com/mortonCareer/bconnect/issues/438)
- CORS `*.dev.bconnect.to` 추가는 BE 후속
- DNS 수동 단계: Vercel/Railway custom domain apply 후 노출되는 CNAME 타겟을 가비아 콘솔에서 등록

## 참조

- [#438](https://github.com/mortonCareer/bconnect/issues/438) : 구현
- [#437](https://github.com/mortonCareer/bconnect/issues/437) : dev auto-deploy
- [#352](https://github.com/mortonCareer/bconnect/issues/352)
- [ADR-0006](0006-dev-as-staging.md)
- [ADR-0009](0009-be-db-hosting-railway-staging.md)
- [ADR-0010](0010-dev-branch-staging-be.md)
