# ADR-0007: 정식 출시 후 BE + DB 호스팅 — Railway → AWS ECS Fargate + RDS 트리거 기반 이전

- **Status**: Proposed
- **Date**: 2026-05-10
- **Deciders**: @manamana32321, @fine-pine (리뷰)
- **Related**: [ADR-0006](./0006-dev-as-staging.md), [#322](https://github.com/mortonCareer/bconnect/issues/322)

## Context

Morton BE 는 현재 [Railway](https://railway.com/pricing) 에서 Spring Boot 컨테이너로 호스팅 ($5–20/월). [ADR-0006](./0006-dev-as-staging.md) 의 단계별 환경 정책에서 명시: 스프린트 5 정식 출시 후 Railway 의 production 분리 또는 AWS 이전 결정 필요.

Morton 컨텍스트:

- **운영 인력**: CTO 1명 (단 ECS on EC2 운영 경험 보유)
- **인접 AWS 인프라**: S3, IAM (terraform 관리, `morton-terraform-state` backend), CloudFront, 향후 RDS 검토
- **CTO 선호 스택** (개인 룰): 클라우드 AWS > Cloudflare, 선언적 관리 (Terraform IaC)
- **사용자 가설**: 베타 ~수백 명, 1년 후 ~수십만 명 (한국 인테리어 종사자 + 업체)
- **region**: 서울 (ap-northeast-2)

## Options

### Option 1: 표준 ECS Fargate (Graviton + Spot 활용)

표준 Fargate Service. Task definition + ALB + Target Group 직접 명시 (terraform-aws-modules/terraform-aws-ecs).

- **장점**:
  - Graviton (ARM64) 지원 — 동일 성능에 ~20% 비용 절감
  - Fargate Spot 지원 — 비-critical task 50% 할인
  - ECS Exec 지원 — 운영 사고 시 컨테이너 shell 접근 가능
  - blue/green deployment (CodeDeploy) — canary 외 옵션
  - Health check parameter 완전 tunable (Spring Boot cold start 대응)
  - Compliance: HIPAA / SOC / PCI / ISO 인증 ([AWS Fargate FAQ](https://aws.amazon.com/fargate/faqs/))
- **단점**:
  - terraform 작성량 ~300줄 (VPC + ALB + SG + Target Group + ECS service + CloudWatch)
  - ALB 단독 $16/월 고정비
  - CTO 1명 학습 곡선 (단 EC2 운영 경험으로 일부 흡수)

### Option 2: ECS on EC2 (사용자 EC2 경험 활용)

EC2 ASG + ECS cluster + capacity provider.

- **장점**:
  - **CTO 의 EC2 운영 경험 직접 활용** — AMI 패치, ASG, capacity provider 익숙
  - **비용 최저** — Spot 70% 할인 + Reserved Instance 30-40% 추가 할인. Steady high traffic 시 Fargate 의 1.5-2x 우위
  - GPU / specific instance type / 대용량 EBS 같은 EC2-only 기능 가능
  - host SSH 접근으로 직접 디버깅
- **단점**:
  - AMI 패치, capacity provider, task placement strategy 직접 관리 (CTO 1명 부담 — 단 경험 상쇄)
  - 인스턴스 사이즈 선택 (vCPU/memory 비율)
  - daemon container (CloudWatch agent 등) per-instance 관리

### Option 3: ECS Fargate Express Mode (re:Invent 2025) ⚠️

App Runner 후계자. Container image + IAM 만으로 ALB+HTTPS+오토스케일 자동 프로비전.

- **장점**:
  - 가장 단순 (terraform ~30줄)
  - ALB 1개를 25 service 공유 → 미래 마이크로서비스 한계비용 0
- **단점**:
  - **Production 사례 0건** (2026-05 시점 — named-customer case study 없음, HN 1 point, GHA repo 7 stars)
  - **Graviton 미지원** — 20% 비용 절감 봉쇄
  - **Fargate Spot 미지원** — 50% 할인 봉쇄
  - **ECS Exec 미지원** — 디버깅 큰 약점
  - **blue/green deployment 미지원** — canary 만
  - **Health check parameter tunable X** — Spring Boot cold start 대응 어려움
  - **terraform-provider-aws#47576** — ALB import 충돌 open
  - **graduate path 부재** — AWS 공식 입장 "graduate 안 해도 standard ECS API 옆 작동" (깔끔하지 않음)

→ **트리거 시점 (~2026 후반) 재평가 후보** — production 사례 ≥ 3건 + Graviton/Spot 지원 추가되면 채택

### Option 4: App Runner ❌

**2026-04-30 부터 신규 진입 차단, maintenance mode** ([InfoQ](https://www.infoq.com/news/2026/04/aws-deprecates-workmail-apprunne/)). 제외.

### Option 5: Elastic Beanstalk

Java PaaS (2008). [Devoteam: Beanstalk → Fargate 모더나이징 권고](https://www.devoteam.com/expert-view/modernising-in-aws-elastic-beanstalk-to-fargate/). Legacy path, 비추.

### Option 6: EKS

매니지드 k8s. cluster $73/월 + 운영 복잡도 폭증. CTO 1명 over-engineering. 비추.

### Option 7: Lightsail Containers

Seoul region 지원하지만 IAM/VPC 연동 제한, S3 통합 어색. 비추.

### Option 8: Lambda (SnapStart)

Spring Boot stateful WAS 제약, 장기 connection 어려움. Stack mismatch. 비추.

### Option 9: Cloud Run (GCP)

Cross-cloud (AWS-first 원칙 위배), GCP IAM/billing 신규 학습. 비추.

### Option 10: Railway 유지

마이그레이션 비용 0. ["ship first, migrate when revenue justifies"](https://solodevstack.com/blog/railway-vs-aws-solo-developers).

- **장점**: 운영 부담 0, 베타 단계 비용 ↓
- **단점**: ALB 분담 효과 없음, 사용량 증가 시 break-even 도달

## Decision

**Railway 완전 폐기 — BE + DB 동시 이전.**

- **BE 1순위**: 표준 ECS Fargate (Graviton + Spot 활용, ap-northeast-2 Seoul)
- **BE 차선**: ECS on EC2 — Steady high traffic 시점 또는 Fargate cost break-even 초과 시 검토
- **BE 보류**: ECS Express Mode — Production maturity 누적 후 (~2026 후반 ~ 2027) 재평가
- **DB**: AWS RDS Postgres (옵션 비교는 별도 ADR-0008 — RDS Postgres / Aurora / Aurora Serverless v2 비교)

BE 와 DB 분리 이전 (small batch) 검토했으나 폐기:

- Railway 는 BE + DB 결합 운영 (단일 청구). 부분 이전 시 Railway 운영 부담 + AWS 운영 부담 둘 다.
- cross-cloud BE↔DB 통신 latency 추가 (Vercel → Railway DB → AWS BE 또는 역방향)
- 트리거 발동 후 1-2주 내 완전 컷오버 — small batch 의 risk 분산보다 단기 마이그레이션이 운영 단순.

### Trigger

**스프린트 5 완료 시점 또는 CTO 임의 결정.**

### 근거

1. **App Runner 사망 → 표준 Fargate 가 stable AWS 컨테이너 호스팅**. ECS Express Mode 는 후계자로 지정됐지만 2026-05 시점 production maturity 부족 (사례 0건, Graviton/Spot/Exec/blue-green 4종 봉쇄). 트리거 시점에 재평가.
2. **Morton 스택 정합성**: 기존 [`infra/`](../../../infra) terraform 자산 + S3/IAM/CloudFront 와 단일 프로파일 (`AWS_PROFILE=morton`). Seoul region 한국 latency 최적.
3. **비용 단계별** — 표준 Fargate + Graviton + Spot 으로 베타부터 1년차까지 Railway 대비 우위. Express Mode 의 비용 봉쇄 없음.
4. **출시 즉시 이전 X** — 마이그레이션 1–2일 CTO 시간. ["ship first, migrate when revenue justifies"](https://solodevstack.com/blog/railway-vs-aws-solo-developers).
5. **Spring Boot cold start**: [AWS SOCI](https://aws.amazon.com/blogs/containers/start-spring-boot-applications-faster-on-aws-fargate-using-soci/) 50% 가속 + ECS Exec 으로 디버깅 + tunable health check grace period.
6. **사용자 EC2 경험** — Option 2 (ECS on EC2) 도 합리적. 트래픽 높아져 비용이 critical 해지면 차선으로 전환.

## Consequences

### 좋은 결과

- AWS 일원화 — IAM/Sentry/S3/Vercel terraform 과 동일 워크플로
- Graviton + Spot 활용으로 Express Mode 대비 비용 우위 + 운영 유연성 (Exec, blue/green)
- Seoul region 한국 latency 최적
- 미래 ECS on EC2 또는 Express Mode 로 graduate 경로 모두 열려 있음 (state import 또는 task definition 변경)

### 나쁜 결과

- terraform 작성량 ~300줄 (Express Mode 의 ~30줄 대비). [terraform-aws-modules/terraform-aws-ecs](https://github.com/terraform-aws-modules/terraform-aws-ecs) v7.5.0 (5.3M dl/year, 668★) 으로 일부 흡수
- ALB 단독 $16/월 고정비 (Express Mode 의 25 share 효과 없음). 미래 마이크로서비스 추가 시 평가 필요
- CTO 1명 운영 부담 — VPC, security group, ALB target health 학습 (단 EC2 경험으로 일부 상쇄)

### 중립적 결과

- RDS 옵션 결정 (Postgres / Aurora / Aurora Serverless v2) 은 **별도 ADR-0008** — 본 ADR 은 "BE + DB 동시 이전" 결정만
- Express Mode 의 production maturity 가 누적되면 (2026 후반 ~ 2027) 재평가 — 그 시점 Graviton/Spot 추가 지원되었으면 자연스러운 graduate

## Notes

### Spring Boot cold start 대응

Fargate 는 Lambda 와 달리 **매 호출 spin up 이 아님** — 최소 N task 항시 유지, cold start 는 deploy / auto-scale / failure 시점에만 발생. 그래도 Spring Boot 자체 부팅이 ~20–60초라 다음 5단계 적용 (단계별 누적):

| 단계 | 방법                                                                                               | 비용                                               | 효과                           |
| ---- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------ |
| 1    | **최소 1 task 항시 유지** (scale-to-zero X)                                                        | 0                                                  | 사용자-facing cold start 0     |
| 2    | **Spring Boot 3.x AOT compilation + lazy initialization** (`spring.main.lazy-initialization=true`) | 0                                                  | 부팅 30–50% 단축               |
| 3    | **AWS SOCI** (Seekable OCI Index — 이미지 lazy load)                                               | 0 (SOCI snapshot)                                  | 이미지 pull ~50% 단축          |
| 4    | **JVM CDS** (Class Data Sharing)                                                                   | 0 (JDK 기본)                                       | startup 10–20% 단축            |
| 5    | **GraalVM Native Image** (JVM 자체 제거)                                                           | 빌드 시간 5분 → 30분 + 일부 라이브러리 호환성 검증 | cold start ~50ms (Lambda 수준) |

베타 (~수백 사용자): 단계 1+2 만 → 첫 deploy ~30초 (사용자 0 영향). 1년차 (~수만): + 단계 3+4 (SOCI). 대규모 또는 cost critical: + 단계 5 (GraalVM).

**Auto-scaling pre-warm**: 트래픽 패턴 알면 미리 task 추가 (`aws_appautoscaling_scheduled_action` cron). 한국 사용자 트래픽이 출근/퇴근 피크 패턴이면 9 AM / 6 PM 미리 scale.

cold start 비교:

| 호스팅                                | Cold start            | 발생 시점            |
| ------------------------------------- | --------------------- | -------------------- |
| Lambda (Java)                         | 5–15초                | **매 호출**          |
| Lambda + SnapStart                    | 1–2초                 | 매 호출              |
| **Fargate (Spring Boot, 단계 1+2+3)** | **~15–30초 (단 1회)** | deploy/auto-scale 시 |
| Fargate + GraalVM                     | ~50ms                 | deploy/auto-scale 시 |

Lambda 는 stateful WAS (DB connection pool, in-memory cache, WebSocket) 제약으로 Spring Boot 패턴과 stack mismatch — 비교만 참조.

### Express Mode 재평가 조건 (2026 후반 ~ 2027)

다음 모두 충족 시 표준 Fargate → Express Mode 또는 신규 deploy 시 Express 우선:

- AWS 공식 named-customer case study ≥ 3건
- Graviton 지원 추가 (20% 비용 회복)
- Fargate Spot 지원 추가
- ECS Exec 지원 추가 (디버깅)
- terraform-provider-aws#47576 resolve

### Future escape hatches

- **표준 Fargate → ECS on EC2**: Task definition launch type 만 변경 (state 보존). Steady high traffic 시점 비용 최적화
- **Fargate → EKS**: 트래픽이 마이크로서비스 5개 이상 + k8s 운영 인력 확보 시
- **Fargate → Lambda (특정 엔드포인트)**: cold-path API 만 SnapStart Lambda 로 분기

### Production maturity audit (tech-scout 2026-05-10)

ECS Express Mode 채택 보류 근거:

| 지표                         | 측정값                                 |
| ---------------------------- | -------------------------------------- |
| AWS 공식 named-customer case | 0건                                    |
| HN 발표 thread               | 1 point, 1 comment                     |
| GHA repo stars               | 7                                      |
| GitHub issue 수              | ~25 (다수 hobby)                       |
| Production 후기              | 0 (모두 getting-started)               |
| 알려진 limitation            | 4종 (Graviton, Spot, Exec, blue/green) |

### References

- [AWS Fargate FAQ — SLA & 컴플라이언스](https://aws.amazon.com/fargate/faqs/)
- [terraform-aws-modules/terraform-aws-ecs v7.5.0](https://github.com/terraform-aws-modules/terraform-aws-ecs) (5.3M dl/year, 668★)
- [Spring Boot on Fargate w/ SOCI (AWS Containers Blog)](https://aws.amazon.com/blogs/containers/start-spring-boot-applications-faster-on-aws-fargate-using-soci/)
- [Railway vs AWS pricing (getdeploying.com)](https://getdeploying.com/aws-vs-railway)
- [Railway pricing (공식)](https://railway.com/pricing)
- [Railway vs AWS for Solo Developers (SoloDevStack 2025)](https://solodevstack.com/blog/railway-vs-aws-solo-developers)
- [ECS Express Mode launch (AWS re:Post 2025-12)](https://repost.aws/articles/ARDZrGhYT1SMCAeGbojOMbsg/re-invent-2025-launch-web-applications-in-seconds-with-amazon-ecs-express-mode)
- [Express Mode IaC 후기 (Jeroen Reijn 2025-12)](https://www.jeroenreijn.com/2025/12/amazon-ecs-express-mode-from-an-iac-perspective.html)
- [Express Mode 한계 검증 (classmethod)](https://dev.classmethod.jp/en/articles/ecs-express-mode-arm64-fargate-spot-exec/)
- [terraform-provider-aws#47576 — ALB import 충돌](https://github.com/hashicorp/terraform-provider-aws/issues/47576)
- [App Runner maintenance mode (InfoQ 2026-04)](https://www.infoq.com/news/2026/04/aws-deprecates-workmail-apprunne/)
- [Beanstalk → Fargate modernization (Devoteam)](https://www.devoteam.com/expert-view/modernising-in-aws-elastic-beanstalk-to-fargate/)
