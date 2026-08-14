# Claude 지침

## 가이드
- 모든 읽기 작업은 READ 도구로, 쓰기 작업은 WRITE 도구로 처리
- 사용자가 승인한 사항과 AI가 제안한 사항을 구분
- 보고서는 HTML 형식으로 생성
- 특정 명령어에 대한 오류가 3회 이상 발생한 경우 해당 작업을 생략하고 보고

## 문체
- 두괄식으로 결론을 먼저 배치 · 개조식으로 서술
- 한 문장은 한 가지 핵심만 서술
- em dash 또는 괄호를 활용한 부연설명 금지. 문장을 분리하거나 생략
- 수식어 대신 사실을 배치. 핵심적인 수치나 조건을 제시
- 고유 표현은 원문 그대로 인용

## 사실성
- 단일 출처 : 지정된 원본만 근거로 사용. 사전지식 혼입 금지
- 창작 금지 : 원본에 없는 내용을 추측해 채우지 않음
- 부재 명시 : 정보가 없으면 없다고 기술. 침묵으로 넘기지 않음
- 파생 금지 : 2차 문서 작성 시 1차 문서만 출처로 사용. 원본 재조회 금지
- 출처 명시 : 파일명과 코드라인 조합

## 문서
| 문서 | 설명                              |
| --- |---------------------------------|
| [project-structure](../docs/project-structure.md) | 도메인 · 레이어 · 의존성 구조              |
| [ubiquitous-language](../../../docs/reference/ubiquitous-language.md) | 도메인 용어 · Enum 값 (루트 docs)     |
| [attachment-architecture](../docs/attachment-architecture.md) | 첨부파일(Attachment) 생명주기           |
| [notification-architecture](../docs/notification-architecture.md) | 알림 저장 · 조회 · 푸시(Push)           |
| [stomp-architecture](../docs/stomp-architecture.md) | 채팅(Chat) · 메시지(Message) STOMP   |
| [security-architecture](../docs/security-architecture.md) | 인증 · 인가 처리 구조                   |
| [exception-list](../docs/exception-list.md) | 예외 코드(ExceptionCode) · Prefix 체계 |
| [test-structure](../docs/test-structure.md) | 테스트 구조                          |
- 위 표의 문서를 SSOT로 간주
- 보편언어는 루트, 나머지는 API 서버에 위치
- 코드 변경사항에 따른 문서 업데이트 방안을 제안

## 탐색
- 라이브러리 활용시 공식 문서를 근거로 답변. 인용에 대한 래퍼런스 작성
- WebSearch 도구 사용시 신뢰할 만한 국문 · 영문 소스를 근거로 답변
- 패키지 간 의존성 분석에는 jdeps를 사용

## 구현
- 명시적으로 승인받지 않은 내용은 구현 금지. 단순 컴파일 에러와 오타는 예외
- 데이터 객체 생성은 인라인 대신 `val`로 선언
- 코드 변경사항 제안시 추가(NEW)와 변경(MOD) 태그를 작성
- 코드 변경사항 제안시 다음 순서에 따라 논의 · 구현
- 코드 변경사항 제안시 2-3가지 방안을 함께 제시하고 비교
- 코드 변경사항 제안시 프로젝트 내부 코드 또는 Best Practice를 근거로 제안
- 코드 변경사항에 따른 레거시 코드와 미사용 import를 제거
- 명시적인 지시가 없다면 주석 작성 금지
- 승인되지 않은 헬퍼 메서드 작성 금지

## 커밋
- 커밋 메시지는 Git 명령어를 사용하지 않고 대화 내역을 바탕으로 제안
- 커밋 메시지는 단순한 국문으로 본문 없이 작성
- 단일 파일에 서로 다른 변경사항이 혼재하는 경우 제거 → 커밋 → 복원 순서로 진행
