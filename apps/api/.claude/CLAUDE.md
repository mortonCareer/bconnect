# 가이드라인

## 제약
- `/api` 범위 내에서만 쓰기 작업을 허용합니다.
- 모든 읽기 작업은 READ 도구로, 쓰기 작업은 WRITE 도구로 처리하세요.
- 사용자가 승인한 사항과 AI가 제안한 사항을 구분하세요.
- 계획 문서는 사용자가 승인한 내용만 포함하세요.
- 특정 명령어에 대한 오류가 3회 이상 발생한 경우 해당 작업을 생략하고 보고하세요.

## 문서
| 문서 | 설명                              |
| --- |---------------------------------|
| [project-structure](../docs/project-structure.md) | 도메인 · 레이어 · 의존성 구조              |
| [ubiquitous-language](../docs/ubiquitous-language.md) | 도메인 용어 · Enum 값                 |
| [attachment-architecture](../docs/attachment-architecture.md) | 첨부파일(Attachment) 생명주기           |
| [notification-architecture](../docs/notification-architecture.md) | 알림 저장 · 조회 · 푸시(Push)           |
| [stomp-architecture](../docs/stomp-architecture.md) | 채팅(Chat) · 메시지(Message) STOMP   |
| [security-architecture](../docs/security-architecture.md) | 인증 · 인가 처리 구조                   |
| [exception-list](../docs/exception-list.md) | 예외 코드(ExceptionCode) · Prefix 체계 |
| [test-structure](../docs/test-structure.md) | 테스트 구조                          |
- `/api/docs` 문서를 SSOT로 간주합니다.
- 코드 변경사항에 따른 문서 업데이트 방안을 제안하세요.

## 탐색
- 라이브러리 활용시 공식 문서를 근거로 답변하고, 인용에 대한 래퍼런스를 작성하세요.
- WebSearch 도구 사용시 신뢰할 만한 국문 · 영문 소스를 근거로 답변하세요.
- 패키지 간 의존성을 분석할 때는 jdeps를 사용하세요.

## 구현
- 명시적으로 승인받지 않은 내용은 절대 구현하지 마세요 (단순 컴파일 에러·오타 제외).
- 코드 변경사항 제안시 추가(NEW)와 변경(MOD) 태그를 작성해주세요.
- 코드 변경사항 제안시 다음 순서에 따라 논의·구현하세요.
  - 한 도메인에 대해 Entity → Controller → DTO → Command → Service → Repository 순서 
  - 한 파일에 대해 Class → Structure → Implement 순서
  - 한 번에 하나의 사항에 대해서만 논의합니다.
  - 이전 대화에서 결정된 경우 생략 가능합니다.
- 코드 변경사항 제안시 2-3가지 방안을 함께 제시하고 비교하세요.
- 코드 변경사항 제안시 프로젝트 내부 코드 또는 Best Practice를 기반으로 제안하세요.
- 코드 변경사항에 따른 레거시 코드와 미사용 import를 제거하세요.
- 커밋 메시지는 Git 명령어를 사용하지 않고 대화 내역을 바탕으로 제안하세요.
- 커밋 메시지는 단순한 국문으로 본문 없이 작성합니다.
- 명시적인 지시가 없다면 주석을 작성하지 마세요.

## 테스트
- 도메인 객체와 엔티티의 제약을 확인하고 케이스를 도출하세요.
- 서비스에서 발생하는 에러코드를 확인하고 케이스를 도출하세요.
- 행위 검증 대신 상태 검증을 수행하세요.
- 테스트 커버리지 80%를 충족해야 합니다.

## 디버깅
- 버그 발생시 최소 재현 케이스를 작성하며 구체적인 원인을 파악합니다.
- 디버깅을 위한 변경사항을 사용자에게 제한하고 승인받으세요.
- 버그가 해결되었다면 커밋메시지와 함께 재발 방지 대책을 제안하세요.