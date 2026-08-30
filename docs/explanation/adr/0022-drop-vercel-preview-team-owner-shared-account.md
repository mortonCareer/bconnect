# ADR-0022: Vercel PR 프리뷰 폐기 + Team Owner 공용 계정 이전 (스프린트 단위 QA 로 전환)

- 상태: 승인됨
- 날짜: 2026-06-10
- 담당자: @manamana32321, @fine-pine

## 개요

BConnect 레포(`mortonCareer/bconnect`)는 private 이다. Vercel 은 Team → Projects 의 1:N 구조로 career·plan 2개 프로젝트를 한 Team 아래 둔다. PR 마다 자동 생성되는 프리뷰 배포의 본래 목적은 디자이너 UI 검수였다. 여기에 CTO 기능 테스트와 CEO 최종 QA 가 더해진다. 이는 [development.md](../../how-to/development.md) 의 QA 사이클이 전제로 깔고 있다.

이 프리뷰 구성에는 비자명한 메커니즘과 그로 인한 우회가 있다.

- private 레포에서 PR 프리뷰가 뜨려면 Team Owner 가 해당 private 레포 접근권을 가진 계정이어야 한다. Vercel 은 프리뷰를 띄울 PR 을 "마지막으로 커밋한 사람" 기준으로 판단한다.
- 그래서 프론트 작업을 가장 많이 하는 CTO(@manamana32321)의 개인 계정을 Morton Team Owner 로 등록해 프리뷰를 활용해 왔다.
- 부작용 1, 수동 더미 커밋: 다른 FE 개발자 @twjin03 의 PR 은 "마지막 커밋한 사람"이 Owner 가 아니라 프리뷰가 뜨지 않는다. CTO 가 매 PR 에 더미 커밋을 얹어 프리뷰를 강제 생성해 왔다. 수동 노동이 들고 PR 후속 커밋 히스토리가 오염된다.
- 부작용 2, 결제·seat 의 개인 계정 종속: Team Owner 가 개인 계정이라 결제·seat 가 개인 계정에 묶인다. 공용 계정을 Owner 로 올리면 seat 추가로 월 $20 가 발생한다. 테스트로 확인한 사실이다.

더 근본적인 변화가 있다. 디자이너 QA 가 사실상 항상 생략되어 왔다. 시각 검수 없이도 시안 정합이 유지되는 수준이었다. 즉 프리뷰의 주목적이 유명무실하다. 동시에 [ADR-0006](./0006-dev-as-staging.md)·[ADR-0016](./0016-environment-service-domain-naming.md) 으로 안정 도메인의 dev 환경이 구축 완료되었다. 이제 QA 를 PR 단위가 아니라 스프린트 단위로 dev 환경에서 수행할 수 있다. 또한 [ADR-0018](./0018-vercel-native-skip-unaffected-projects.md) 실측대로 현재 매 푸시 career·plan 양쪽이 always-build 중인데, 프리뷰가 불필요해지면 이 빌드도 낭비다.

## 선택지

### 옵션 1: 현행 유지, 개인 계정 Owner + 수동 더미 커밋

장점

- PR 단위 프리뷰 유지
- 작업 0

단점

- 개인 계정 종속. 공용 이전 불가
- @twjin03 PR 마다 수동 더미 커밋
- 결제·seat 개인 계정 종속 지속

### 옵션 2: 프리뷰 유지 + CI/CD 에서 공용 계정으로 더미 커밋 자동화

공용 계정을 Owner 로 올린다. 마지막 커밋을 공용 계정 PAT 또는 GitHub Actions 내장 봇으로 자동 더미 커밋해 프리뷰를 띄운다.

장점

- 공용 계정 Owner 가능
- 프리뷰 유지
- 수동 노동 제거

단점

- PR 후속 커밋마다 봇 커밋이 끼어 히스토리가 지저분
- PAT 주입·관리 복잡도
- 프리뷰 주목적인 디자이너 QA 가 미사용인데 인프라를 유지하는 본말전도

### 옵션 3: 레포 Public 전환

장점

- private 제약이 사라져 프리뷰 자유

단점

- 소스 공개 불가. 절대 반대

### 옵션 4: 프리뷰 폐기 + Team Owner 공용 계정 이전 + 스프린트 단위 dev QA (채택)

PR 프리뷰를 비활성화한다. CI 체크·코멘트도 포함이다. Morton Team Owner 를 CTO 개인 계정에서 공용 계정으로 이전한다. QA 는 dev 환경에서 스프린트 단위로 수행한다. dev 도메인은 [ADR-0016](./0016-environment-service-domain-naming.md) 을 따른다.

장점

- 개인 계정·수동 더미 커밋 의존 종료
- 결제·seat 공용 계정으로 일원화
- 미사용 QA 인프라 제거
- [ADR-0018](./0018-vercel-native-skip-unaffected-projects.md) always-build 의 프리뷰 빌드분 절감
- @twjin03 도 개발자라 로컬에서 자체 확인 가능

단점

- PR 단위 즉시 시각 검수 상실. 회귀가 스프린트 QA 시점에야 발견될 수 있다.

## 결정사항

옵션 4 를 채택한다. 우선시한 force 는 세 가지다.

1. 운영 단순성. 수동 더미 커밋 종료
2. 계정·결제 일원화. 개인에서 공용으로
3. 사용하지 않는 QA 인프라 제거

프리뷰의 주목적인 디자이너 PR 단위 검수가 실제로 생략돼 왔다. dev 환경이라는 대체 QA 기반도 이미 있다. 따라서 인프라를 옵션 2 의 자동화로 떠받치기보다 폐기하는 편이 현실에 정합한다.

받아들인 트레이드오프는 PR 단위 프리뷰의 상실이다. UI 검수는 PR 단위에서 스프린트 단위 dev 환경 QA 로 옮긴다. 레포 Public 전환(옵션 3)은 소스 공개 불가로 배제.

## 기대 효과

- 좋은 결과:
  - Team Owner 를 공용 계정으로 이전 → 결제·seat 가 개인 계정에서 분리·일원화
  - 매 PR 수동 더미 커밋 노동 종료, PR 커밋 히스토리가 깨끗해짐
  - 미사용 프리뷰 빌드 제거로 [ADR-0018](./0018-vercel-native-skip-unaffected-projects.md) always-build 의 빌드 분(分) 절감
- 나쁜 결과:
  - PR 단위 즉시 시각 검수 상실 → 시각 회귀가 스프린트 QA 까지 늦게 발견될 수 있음. 스프린트 단위 검수로 위험을 관리한다.
- 중립적 결과:
  - production 배포는 그대로다. career(`bconnect.to`)·plan(`plan.bconnect.to`) 의 main→production 배포와 dev 자동배포는 유지된다. 근거는 [ADR-0006](./0006-dev-as-staging.md)·[ADR-0016](./0016-environment-service-domain-naming.md) 이다. 끄는 것은 PR 프리뷰뿐이다.
  - QA 주체와 범위는 유지한다. 주체는 디자이너·CTO·CEO 다. 검수 주기만 PR 에서 스프린트로 바뀐다.

## 메모

- [ADR-0018](./0018-vercel-native-skip-unaffected-projects.md) 의 always-build 동기는 프리뷰 신뢰성 확보였다. 이 동기는 PR 프리뷰 폐기로 프리뷰 측면에 한해 무력화된다. dev 자동배포 빌드는 남으므로 ADR-0018 자체를 supersede 하진 않고, 관계만 연결한다.
- 후속: Team Owner 이전과 PR 프리뷰·체크 비활성화 실행은 [#571](https://github.com/mortonCareer/bconnect/issues/571) 에서 다룬다. 이전 방향은 개인에서 공용이다.
- 동기화된 워크플로 문서: [development.md](../../how-to/development.md). QA 서술을 스프린트 단위 dev 로 정합했다.

## 참조

- [#571](https://github.com/mortonCareer/bconnect/issues/571) : 구현 추적
- [ADR-0006](./0006-dev-as-staging.md)
- [ADR-0016](./0016-environment-service-domain-naming.md)
- [ADR-0018](./0018-vercel-native-skip-unaffected-projects.md)
- [development.md](../../how-to/development.md)
