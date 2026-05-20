# ADR-0009: BE + DB 호스팅 — Railway 유지 + staging environment, AWS 이전 분기점 기반 보류

- **Status**: Proposed
- **Date**: 2026-05-14
- **Deciders**: @manamana32321, @fine-pine (리뷰)
- **Related**: [ADR-0007](./0007-be-hosting-after-launch.md) (supersedes), [ADR-0006](./0006-dev-as-staging.md), [ADR-0010](./0010-dev-branch-staging-be.md) (자매 결정), [#339](https://github.com/mortonCareer/bconnect/issues/339)

## Context

[ADR-0007](./0007-be-hosting-after-launch.md) 은 "정식 출시 후 Railway 완전 폐기 → AWS ECS Fargate + RDS 이전" 을 결정했다 (Status: Proposed). 트리거는 "스프린트 5 완료 시점 또는 CTO 임의 결정".

스프린트 5 접근 시점에서 재평가하니, 그 트리거에 따라 지금 이전하는 것은 이르다:

- **시기상조 — PMF 미검증**: 마이그레이션은 CTO 1–2일 + 지속 운영 부담. product-market fit 검증 전에 투입하기엔 이르다.
- **CTO 시간은 기능에 우선 배분**: 인프라 현대화보다 제품 기능 개발이 현 단계 우선순위.
- **Railway 가 아직 충분**: 비용·성능 pain point 미도달. ADR-0007 이 인용한 ["ship first, migrate when revenue justifies"](https://solodevstack.com/blog/railway-vs-aws-solo-developers) 원칙을 더 길게 적용할 여지.

또한 [ADR-0006](./0006-dev-as-staging.md) 이 dev = mock 기반 **FE** staging 을 정착시켰으나, **BE + DB 의 staging 환경은 부재** — 현재 Railway 에는 production 만 존재한다. dev 브랜치를 실 BE 에 연결하려면 ([ADR-0010](./0010-dev-branch-staging-be.md)) staging BE 가 먼저 있어야 한다.

따라서 BE + DB 호스팅을 **"언제 이전하나"** 와 **"staging 을 어디에 두나"** 두 축에서 재정의한다. 목적지(어떤 AWS 서비스로) 분석은 ADR-0007 이 이미 10개 옵션을 상세 평가했으므로 본 ADR 은 재론하지 않는다.

## Options

### Option 1: ADR-0007 그대로 실행 — 스프린트 5 에 AWS 이전

- **장점**: 결정 번복 없음. AWS 일원화(IAM/S3/CloudFront 와 단일 프로파일) 조기 달성.
- **단점**: PMF 미검증 단계에 CTO 1–2일 + 운영 부담 투입. "스프린트 5 완료" 는 인프라 필요와 인과 없는 달력 트리거 — 스프린트 번호가 Railway 한계 도달을 의미하지 않는다.

### Option 2: Railway 유지 + staging 을 Railway environment 로 추가, 스케일·비용 트리거로 AWS 보류

BE + DB 모두 Railway 유지. staging 은 Railway 같은 프로젝트 내 별도 environment (BE service + Postgres 각각 staging 인스턴스). AWS 이전 트리거를 스케일·비용 기반으로 재정의.

- **장점**: 지금 마이그레이션 비용 0 → CTO 시간을 기능에. 트리거가 "Railway 를 졸업하는 이유 그 자체" 와 인과 일치. staging 이 Railway environment 로 저비용 구성 (변수 오버라이드만).
- **단점**: AWS 일원화 지연 — BE+DB(Railway) ↔ 나머지 인프라(AWS) 이원 운영 지속. 트리거 도달 시 BE+DB 동시 이전 부담은 미래로 이연 (ADR-0007 이 분석한 그대로). Railway environment 간 변수 동기화 관리 필요.

### Option 3: Railway 유지하되 staging 은 별도 Railway 프로젝트

- **장점**: 청구·접근권한 완전 격리.
- **단점**: 프로젝트 설정 중복. prod 와의 패리티(동일 서비스 구성) 수동 유지 부담. environment 분리(Option 2)로 충분한 격리를 더 적은 관리비용으로 달성 가능.

### Option 4: 트리거 없이 무기한 Railway

- **장점**: 가장 단순. 재검토 시점을 정하는 인지 비용 없음.
- **단점**: "언제 재검토하나" 가 불명 → Railway 비용이 조용히 누적돼도 트리거 부재로 방치 위험. ADR 로서 약하다 — 재검토 신호가 없는 "보류" 는 결정이 아니라 방치.

## Decision

**Option 2 채택 — Railway 유지, BE + DB staging 을 Railway 같은 프로젝트 내 별도 environment 로 추가, AWS 이전은 스케일·비용 트리거 기반 보류.**

이 결정은 [ADR-0007](./0007-be-hosting-after-launch.md) 을 **supersede** 한다. 단 **타이밍과 트리거만 교체**한다 — ADR-0007 의 목적지 분석(ECS Fargate vs ECS on EC2 vs Express Mode 등 10개 옵션, Spring Boot cold start 5단계 대응, tech-scout maturity audit)은 폐기되지 않으며 **트리거 발동 시점의 출발 참조로 유효**하다.

ADR-0007 대비 변경점:

| 항목              | ADR-0007                           | ADR-0009 (본 ADR)                                    |
| ----------------- | ---------------------------------- | ---------------------------------------------------- |
| BE+DB 위치 (현재) | Railway → AWS 이전 예정            | **Railway 유지**                                     |
| 트리거            | 스프린트 5 완료 또는 CTO 임의 결정 | Railway 비용 > AWS break-even 추정, 또는 트래픽 임계 |
| staging 환경      | (없음)                             | Railway 같은 프로젝트 별도 environment               |
| 목적지(AWS) 분석  | 본문에 10개 옵션 상세              | ADR-0007 본문 그대로 참조 (트리거 발동 시)           |

### 트리거 정의 — 왜 스케일·비용인가

트리거 후보 비교:

| 후보              | 인프라 필요와의 인과                                              | 판정 |
| ----------------- | ----------------------------------------------------------------- | ---- |
| 달력 (스프린트 5) | 스프린트 번호는 Railway 한계와 무관                               | ✗    |
| 매출 마일스톤     | 매출 ≠ 트래픽. 무료 베타가 대량 트래픽일 수도, 유료가 소량일 수도 | ✗    |
| 투자 유치         | 자금 확보 ≠ 인프라 필요. 여력이지 신호가 아니다                   | ✗    |
| 트리거 없음       | 재검토 신호 부재 → 비용 누적 방치                                 | ✗    |
| **스케일·비용**   | **Railway 를 졸업하는 이유 그 자체**                              | ✓    |

구체 측정 신호 (둘 중 하나라도 충족 시 ADR-0007 재발동 검토):

1. **비용**: Railway 월 청구액이 AWS(ADR-0007 의 표준 Fargate + Graviton + Spot 구성) 추정 비용을 초과하는 추세
2. **스케일**: 동시접속 / 응답시간 메트릭이 Railway 인스턴스 한계에 근접

### 근거

1. **시기상조** — PMF 미검증 단계. 마이그레이션 비용을 검증 전에 쓰지 않는다.
2. **CTO 시간 희소** — 인프라보다 제품 기능 우선.
3. **Railway 충분** — pain point 미도달. 'ship first' 원칙 연장.
4. **staging 은 Railway environment 로 저비용** — 별도 프로젝트(Option 3)의 설정 중복 회피.
5. **ADR-0007 분석 보존** — 트리거 발동 시 목적지 재조사 0. supersede 가 바꾸는 건 _언제_ 지 _어디로_ 가 아니다.

## Consequences

### 좋은 결과

- 지금 마이그레이션 비용 0 — CTO 시간을 제품 기능에 집중
- 트리거가 인과적 — "왜 지금 이전하나" 에 명확히 답하는 재검토 신호 확보
- BE + DB staging 환경 확보 — [ADR-0010](./0010-dev-branch-staging-be.md)(dev = 실 staging BE)의 전제 충족
- ADR-0007 의 목적지 분석이 live reference 로 보존 — 트리거 발동 시 즉시 실행 가능

### 나쁜 결과

- AWS 일원화 지연 — IAM/S3/CloudFront 는 AWS, BE+DB 는 Railway 이원 운영 지속
- 트리거 도달 시 BE+DB 동시 이전 부담은 미래로 이연 (ADR-0007 이 이미 분석한 비용)
- Railway environment 간 변수·구성 동기화 — prod/staging 패리티 수동 관리
- 트리거 메트릭을 **실제로 모니터링**해야 의미가 있다 — 안 보면 Option 4(트리거 없음)와 동일해진다 → 후속 작업으로 모니터링 셋업 필수

### 중립적 결과

- **RDS 옵션 결정** (ADR-0007 이 "별도 ADR" 로 미룬 Postgres / Aurora / Serverless v2 선택)은 트리거 발동 시점으로 함께 연기. 현재 Railway Postgres 유지.
- staging DB 는 Railway Postgres 별도 인스턴스 — production 데이터와 격리

## Notes

### 후속 작업 (별도 이슈)

- Railway staging environment 프로비저닝 — BE service + Postgres, [`infra/railway/`](../../../infra/railway/) terraform 모듈
- staging 환경변수 셋업 — production 변수의 staging 오버라이드
- **트리거 모니터링 가시화** — Railway 월 청구액 추세 + 동시접속·응답시간 메트릭. 이게 없으면 트리거가 무의미해진다
- dev 브랜치 → staging BE 연결은 [ADR-0010](./0010-dev-branch-staging-be.md)

### 트리거 재평가 주기

분기별 정기 점검, 또는 Railway 청구액 유의미 변동 시 수시.

### ADR-0007 과의 관계

supersede 이되 목적지 분석은 **live reference**. 트리거 발동 시 ADR-0007 의 "Decision"(표준 ECS Fargate 1순위, ECS on EC2 차선)과 "Notes"(cold start 대응, future escape hatches)가 그대로 실행 출발점이 된다.
