# ADR-0007: 정식 출시 후 BE 호스팅 — Railway → AWS ECS Fargate (Express Mode) 트리거 기반 이전

- **Status**: Proposed
- **Date**: 2026-05-10
- **Deciders**: @manamana32321, @fine-pine (리뷰)
- **Related**: [ADR-0006](./0006-dev-as-staging.md), [#322](https://github.com/mortonCareer/bconnect/issues/322)

## Context

Morton BE 는 현재 [Railway](https://railway.com/pricing) 에서 Spring Boot 컨테이너로 호스팅 ($5–20/월). [ADR-0006](./0006-dev-as-staging.md) 의 단계별 환경 정책에서 명시: 스프린트 5 정식 출시 후 Railway 의 production 분리 또는 AWS 이전 결정 필요.

Morton 컨텍스트:

- **운영 인력**: CTO 1명 단독
- **인접 AWS 인프라**: S3 (kiscon sync, profile uploads), IAM (terraform 관리, `morton-terraform-state` backend), CloudFront, 향후 RDS 검토
- **CTO 선호 스택** (개인 룰): 클라우드 AWS > Cloudflare, 선언적 관리 (Terraform IaC)
- **사용자 가설**: 베타 ~수백 명, 1년 후 ~수십만 명 (한국 인테리어 종사자 + 업체)
- **region**: 서울 (ap-northeast-2)

핵심 의문: **이전이 정말 필요한가? 필요하다면 AWS 의 어느 서비스인가?**

## Options

### Option 1: ECS Fargate Express Mode

re:Invent 2025 신규 abstraction. `container image + task execution role + infra role` 3개 입력으로 ALB+HTTPS+오토스케일+CloudWatch 자동 프로비전 ([AWS re:Post](https://repost.aws/articles/ARDZrGhYT1SMCAeGbojOMbsg/re-invent-2025-launch-web-applications-in-seconds-with-amazon-ecs-express-mode)). AWS 공식 App Runner 후계자.

- **장점**:
  - **ALB 1개를 25 service 까지 공유** → 미래 morton 마이크로서비스 추가 시 한계비용 0
  - terraform 지원: [`terraform-aws-modules/terraform-aws-ecs`](https://github.com/terraform-aws-modules/terraform-aws-ecs) v7.5.0 (5.3M dl/year, 668★)
  - 졸업 path: Express Mode → 표준 Fargate 자연스러움 (state import 만)
- **단점**: re:Invent 2025 출시라 production 사례 적음 (단 표준 Fargate 위 abstraction 이라 risk 작음)

### Option 2: ECS Fargate (full custom)

표준 Fargate. ALB/Target Group 직접 설정.

- **장점**: cloud-native 표준, control 강함
- **단점**: ALB 단독 $16/월. CTO 1명 학습 부담 (Express Mode 가 흡수)

### Option 3: App Runner ❌

**2026-04-30 부터 신규 진입 차단, maintenance mode** ([InfoQ](https://www.infoq.com/news/2026/04/aws-deprecates-workmail-apprunne/), [terraform-provider-aws #47161](https://github.com/hashicorp/terraform-provider-aws/issues/47161)).

- **제외**: 신규 사용 불가

### Option 4: Elastic Beanstalk

Java PaaS (2008). [Devoteam: Beanstalk → Fargate 모더나이징 권고](https://www.devoteam.com/expert-view/modernising-in-aws-elastic-beanstalk-to-fargate/).

- **장점**: Java 친화
- **단점**: legacy path, AWS lock-in, 미래 모더나이징 비용

### Option 5: ECS on EC2

EC2 직접 관리.

- **장점**: 비용 ↓ (Spot 시 70% 할인)
- **단점**: AMI 패치, scaling group, capacity provider — CTO 1명 부담

### Option 6: EKS

매니지드 k8s.

- **장점**: 미래 표준
- **단점**: cluster $73/월 + node 비용. 운영 복잡도 폭증. CTO 1명 over-engineering

### Option 7: Lightsail Containers

[Seoul region 지원](https://aws.amazon.com/blogs/aws/lightsail-containers-an-easy-way-to-run-your-containers-in-the-cloud/).

- **장점**: 단순
- **단점**: resize 시 snapshot 재생성, IAM/VPC 연동 제한 — S3 통합 어색

### Option 8: Lambda (SnapStart)

- **단점**: Spring Boot stateful WAS 제약, 장기 connection 어려움. SnapStart 로도 stack mismatch

### Option 9: Cloud Run (GCP)

- **장점**: container spinup 빠름, ALB 내장
- **단점**: cross-cloud (AWS-first 원칙 위배), GCP IAM/billing 신규 학습

### Option 10: Railway 유지

마이그레이션 비용 0. [SoloDevStack 가이드](https://solodevstack.com/blog/railway-vs-aws-solo-developers): "AWS 는 actual revenue 가 hosting cost 정당화할 때 이전".

- **장점**: 운영 부담 0, 베타 단계 비용 ↓
- **단점**: ALB 분담 효과 없음, 사용량 증가 시 break-even 도달

## Decision

**1순위: ECS Fargate Express Mode (ap-northeast-2)** — 단 **트리거 충족 시점에 이전**.

### Trigger (둘 중 하나 충족 시 이전 진행)

1. **비용 트리거**: Railway 월 청구액 USD 50 초과 3개월 연속 — [동일 스펙 break-even ~$57](https://getdeploying.com/aws-vs-railway)
2. **운영 트리거** (다음 중 하나):
   - private VPC peering 필요 (RDS Seoul 이전 결정 시)
   - SLA 99.9% 외부 약속 발생
   - Sentry/Blackbox 외 더 깊은 AWS 네이티브 옵저버빌리티 필요

### 근거

1. **App Runner 사망 → ECS Express Mode 가 후계자**. AWS 자체가 명시적으로 지정. 신규 진입 가능한 표준 abstraction.
2. **Morton 스택 정합성**: 기존 [`infra/`](../../../infra) terraform 자산 + S3/IAM/CloudFront 와 단일 프로파일 (`AWS_PROFILE=morton`). Seoul region 한국 latency 최적.
3. **비용 단계별**: 베타 (~$25–35) Railway 우세, 1년차 (~$80–150) AWS 우세. break-even ≈ $50/월 (트리거 1).
4. **출시 즉시 이전 X**: 마이그레이션 비용 1–2일 CTO 시간. 베타 단계에서 인프라 변경은 product iteration 속도 떨굼. ["ship first, migrate when revenue justifies"](https://solodevstack.com/blog/railway-vs-aws-solo-developers).
5. **Spring Boot cold start**: [AWS SOCI](https://aws.amazon.com/blogs/containers/start-spring-boot-applications-faster-on-aws-fargate-using-soci/) 50% 가속, sub-30초 달성. 최소 1 task 항시 유지로 사용자 영향 0.

## Consequences

### 좋은 결과

- AWS 일원화 — IAM/Sentry/S3/Vercel terraform 과 동일 워크플로
- Express Mode → 표준 Fargate 자연스러운 graduation (state import 만)
- Seoul region 한국 latency 최적
- ALB 공유로 미래 마이크로서비스 한계비용 0

### 나쁜 결과

- CTO 1명 운영 부담 증가: VPC, security group, ALB target health, ECS task definition 학습 (Express Mode 가 일부 흡수)
- 베타 단계 이전 시 비용 증가 ($25–35 vs Railway $5–20) — **트리거 가드로 회피**
- Spring Boot 콜드 스타트 — SOCI 적용 전 20–60초. 최소 1 task 항시 유지 필수

### 중립적 결과

- Railway Postgres → RDS 이전은 **별도 ADR** (본 결정 범위 외). BE 컨테이너만 먼저 이전, DB 는 Railway 유지 후 cross-cloud latency 측정 후 결정. small batch principle.
- 미래 EKS 후보 부상 시 Express Mode → 표준 Fargate → EKS 순 escape hatch 존재.

## Migration Plan (트리거 발동 시)

### Phase 0 — 준비 (CTO 0.5일)

- [`infra/`](../../../infra) 에 `module "ecs_be"` 추가 (terraform-aws-modules/terraform-aws-ecs v7.x)
- ECR repo 프로비전 + GHA `ci-api` 빌드 산출물을 ECR push 로 변경
- AWS Secrets Manager + ECS task secrets 사용 (`JWT_SECRET`, `DATABASE_URL`)

### Phase 1 — 병행 운영 (1주)

- Railway 운영 유지, AWS Fargate 에 동일 컨테이너 동시 배포
- Vercel `NEXT_PUBLIC_API_URL` 을 두 환경 모두 가리키도록 weighted DNS (Route53) — 10% AWS, 90% Railway

### Phase 2 — 컷오버 (1일)

- Blackbox Exporter probe 로 AWS 엔드포인트 SLA 검증 (24h)
- 트래픽 100% AWS 전환, Railway BE 서비스 중단 (DB 는 별도 결정까지 유지)
- Sentry release tag 갱신, Vercel env 정리

### Phase 3 — 롤백 플랜

- Route53 weighted record 로 즉시 50/50 또는 0/100 Railway 회귀 가능
- Railway 서비스 1개월간 정지 (suspended) — 비용 0, 인스턴스 즉시 재기동 가능

## Notes

### Future escape hatches

- **Express Mode → 표준 ECS Fargate**: ECS service definition import + ALB/SG 분리 (state import 만, 다운타임 0)
- **Fargate → EKS**: 트래픽이 마이크로서비스 5개 이상 + k8s 운영 인력 확보 시
- **Fargate → Lambda (특정 엔드포인트)**: cold-path API 만 SnapStart Lambda 로 분기 (비용 절감)

### References

- [AWS App Runner maintenance mode (InfoQ 2026-04)](https://www.infoq.com/news/2026/04/aws-deprecates-workmail-apprunne/)
- [terraform-provider-aws #47161 — App Runner deprecation](https://github.com/hashicorp/terraform-provider-aws/issues/47161)
- [ECS Express Mode launch (AWS re:Post 2025-12)](https://repost.aws/articles/ARDZrGhYT1SMCAeGbojOMbsg/re-invent-2025-launch-web-applications-in-seconds-with-amazon-ecs-express-mode)
- [terraform-aws-modules/terraform-aws-ecs v7.5.0](https://github.com/terraform-aws-modules/terraform-aws-ecs) (5.3M dl/year, 668★)
- [Spring Boot on Fargate w/ SOCI (AWS Containers Blog)](https://aws.amazon.com/blogs/containers/start-spring-boot-applications-faster-on-aws-fargate-using-soci/)
- [Railway vs AWS pricing (getdeploying.com)](https://getdeploying.com/aws-vs-railway)
- [Railway pricing (공식)](https://railway.com/pricing)
- [Railway vs AWS for Solo Developers (SoloDevStack 2025)](https://solodevstack.com/blog/railway-vs-aws-solo-developers)
- [Migrating off App Runner before April 30 (DEV)](https://dev.to/gyorgy/migrating-off-aws-app-runner-before-the-april-30-deadline-5g8m)
- [Fargate vs App Runner cost (cloudonaut)](https://cloudonaut.io/fargate-vs-apprunner/)
- [Beanstalk → Fargate modernization (Devoteam)](https://www.devoteam.com/expert-view/modernising-in-aws-elastic-beanstalk-to-fargate/)
