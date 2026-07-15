# ExceptionCode 목록
- 위치 : 전체
- 범위 : 예외 코드(ExceptionCode)

## Prefix 체계

| Prefix | 도메인 | 위치 |
| --- | --- | --- |
| `C` | 공통 | `common` |
| `A` | 인증 | `security` |
| `M` | 회원 | `core/domain/member` |
| `P` | 프로필 | `core/domain/profile` |
| `CO` | 업체 | `core/domain/company` |
| `T` | 작업 | `core/domain/task` |
| `CW` | 동료 | `core/domain/coworker` |
| `RC` | 추천서 | `core/domain/recommendation` |
| `CH` | 채팅 | `core/domain/chat` |
| `OF` | 제안 | `core/domain/offer` |
| `AT` | 첨부 | `attachment/domain` |

---

## CommonExceptionCode

| 코드 | 이름 | HTTP | LogLevel | 메시지 |
| --- | --- | --- | --- | --- |
| C001 | NOT_VALID | 400 | INFO | 유효하지 않은 입력값입니다. |
| C002 | TYPE_MISMATCH | 400 | INFO | 요청 값의 타입이 올바르지 않습니다. |
| C003 | MISSING_PARAMETER | 400 | INFO | 필수 요청 파라미터가 누락되었습니다. |
| C004 | FORBIDDEN | 403 | WARN | 리소스 접근 권한이 없습니다. |
| C005 | NOT_FOUND | 404 | INFO | 요청한 리소스를 찾을 수 없습니다. |
| C006 | UNSUPPORTED_MEDIA_TYPE | 415 | WARN | 지원하지 않는 미디어 형식입니다. |
| C007 | INTERNAL_SERVER_ERROR | 500 | ERROR | 서버 내부 오류입니다. |
| C008 | PATH_NOT_FOUND | 404 | INFO | 요청 경로를 찾을 수 없습니다. |

## AuthExceptionCode

| 코드 | 이름 | HTTP | LogLevel | 메시지 |
| --- | --- | --- | --- | --- |
| A001 | OTP_DAILY_LIMIT | 429 | INFO | 일일 발송 한도를 초과했습니다. |
| A002 | OTP_RATE_LIMIT | 429 | INFO | 재전송 대기 시간이 지나지 않았습니다. |
| A003 | OTP_MAX_ATTEMPTS | 400 | INFO | 인증 시도 횟수를 초과했습니다. |
| A004 | INVALID_OTP | 400 | INFO | 유효하지 않은 인증번호입니다. |
| A005 | OTP_EXPIRED | 400 | INFO | 만료된 인증번호입니다. |
| A006 | INVALID_SIGNUP_TOKEN | 400 | INFO | 유효하지 않은 가입 토큰입니다. |
| A007 | SIGNUP_TOKEN_EXPIRED | 400 | INFO | 만료된 가입 토큰입니다. |
| A008 | INVALID_SESSION | 401 | INFO | 유효하지 않은 세션입니다. |
| A009 | INVALID_JWT_TOKEN | 401 | WARN | 유효하지 않은 토큰입니다. |
| A010 | EXPIRED_JWT_TOKEN | 401 | INFO | 만료된 토큰입니다. |

## MemberExceptionCode

| 코드 | 이름 | HTTP | LogLevel | 메시지 |
| --- | --- | --- | --- | --- |
| M001 | DUPLICATE_USERNAME | 409 | INFO | 이미 사용 중인 사용자명입니다. |
| M002 | DUPLICATE_PHONE | 409 | INFO | 이미 사용 중인 전화번호입니다. |
| M003 | WITHDRAW_COMPANY_EXISTS | 409 | INFO | 소유한 업체가 있어 탈퇴할 수 없습니다. 업체를 먼저 삭제해주세요. |

## ProfileExceptionCode

| 코드 | 이름 | HTTP | LogLevel | 메시지 |
| --- | --- | --- | --- | --- |
| P001 | ALREADY_EXISTS | 409 | INFO | 이미 프로필이 존재합니다. |
| P002 | INVALID_PRIMARY_TRADE | 400 | INFO | 대표 공종은 선택한 공종 중에서만 지정할 수 있습니다. |

## CompanyExceptionCode

| 코드 | 이름 | HTTP | LogLevel | 메시지 |
| --- | --- | --- | --- | --- |
| CO001 | ALREADY_EXISTS | 409 | INFO | 이미 업체가 존재합니다. |
| CO002 | DUPLICATE_BRN | 409 | INFO | 이미 등록된 사업자등록번호입니다. |

## TaskExceptionCode

| 코드 | 이름 | HTTP | LogLevel | 메시지 |
| --- | --- | --- | --- | --- |
| T001 | NOT_ASSIGNED | 409 | INFO | 기술자에게 할당되지 않은 작업입니다. |

## OfferExceptionCode

| 코드 | 이름 | HTTP | LogLevel | 메시지 |
| --- | --- | --- | --- | --- |
| OF001 | NOT_PROJECT_TASK | 400 | INFO | 프로젝트 작업에만 제안할 수 있습니다. |
| OF002 | INVALID_STATUS | 409 | INFO | 처리할 수 없는 제안 상태입니다. |
| OF003 | INVALID_REORDER | 400 | INFO | 재정렬 대상이 올바르지 않습니다. |

## CoworkerExceptionCode

| 코드 | 이름 | HTTP | LogLevel | 메시지 |
| --- | --- | --- | --- | --- |
| CW001 | SELF_REQUEST | 400 | INFO | 자기 자신에게 동료 요청을 보낼 수 없습니다. |
| CW002 | ALREADY_COWORKER | 409 | INFO | 이미 동료인 사용자입니다. |

## RecommendationExceptionCode

| 코드 | 이름 | HTTP | LogLevel | 메시지 |
| --- | --- | --- | --- | --- |
| RC001 | SELF_RECOMMENDATION | 400 | INFO | 자신에게 추천서를 작성할 수 없습니다. |
| RC002 | NOT_COWORKER | 400 | INFO | 동료 관계인 사용자에게만 추천서를 작성할 수 있습니다. |
| RC003 | ALREADY_EXISTS | 409 | INFO | 이미 추천서를 작성한 사용자입니다. |

## ChatExceptionCode

| 코드 | 이름 | HTTP | LogLevel | 메시지 |
| --- | --- | --- | --- | --- |
| CH001 | SELF_NOT_INCLUDED | 400 | INFO | 참여자 목록에 본인이 포함되어야 합니다. |
| CH002 | INVALID_ATTACHMENT | 400 | INFO | 메시지 타입과 첨부가 일치하지 않습니다. |

## AttachmentExceptionCode

| 코드 | 이름 | HTTP | LogLevel | 메시지 |
| --- | --- | --- | --- | --- |
| AT001 | FILE_TOO_LARGE | 413 | INFO | 파일 크기가 허용치를 초과했습니다. |
| AT002 | TOO_MANY_FILES | 400 | INFO | 한 번에 업로드할 수 있는 파일 수를 초과했습니다. |
| AT003 | UNSUPPORTED_FILE_TYPE | 415 | WARN | 허용되지 않는 파일 형식입니다. |
| AT004 | NOT_COMPLETED | 400 | INFO | 업로드가 완료되지 않은 첨부파일입니다. |
| AT005 | INVALID_LINKED | 404 | INFO | 연결되지 않은 첨부파일입니다. |
