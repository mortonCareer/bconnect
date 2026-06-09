# 프로젝트 구조

## 패키지 구조

```
to.bconnect.api
├── common                  # 공통 모듈
├── config                  # 설정
├── presentation/v1         # Presentation 레이어
│   ├── request
│   └── response
├── domain                  # Domain 레이어
│   ├── chat
│   └── ...
├── storage                 # Storage 레이어
│   ├── value
│   └── domain
├── security                # 인증 · 인가
│   └── member
├── support                 # 제3자 서비스
└── ws                      # 실시간 통신 (STOMP)
```
- 레이어드 아키텍처(layer-first) 구조를 따릅니다.
- 패키지의 의존성 규칙은 ArchUnit로 강제합니다.

## 레이어 구조

```mermaid
# TODO
```

| 레이어         | 패키지          | 행위 클래스     | 데이터 객체 | 변환 책임    | 도메인 교차                             |
|-------------|--------------|------------|--------|----------|------------------------------------|
| Presentation | `presentation` | Controller | DTO | DTO      | 허용 (Controller → Service)          |
| Domain      | `domain`    | Service    | Domain | Service  | 허용 (Service → Service, Repository) |
| Storage     | `storage`   | Repository | Entity |          | 비허용                                |

- 비즈니스 로직은 기본적으로 서비스 클래스에서 처리합니다.
  - 비즈니스 로직이 복잡한 경우 하위 컴포넌트를 생성합니다. (e.g. Finder, Validator, etc)
  - 하향식 도메인 교차는 모두 허용되며, 응집도에 따른 의존성을 고려해야 합니다.
- 메서드명은 기본적으로 **비즈니스 관점**에서 작성합니다.
