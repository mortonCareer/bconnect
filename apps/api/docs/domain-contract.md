# 도메인 패키지 제약사항

## 범위
- 서비스(Service)
- 도메인 객체(Domain Object)

## 서비스 유형

| 유형           | 설명                          |
| -------------- | ----------------------------- |
| `XXXService`   | 기본 서비스, 퍼사드(Facade) 서비스 |
| `XXXFinder`    | 쿼리 메서드                   |
| `XXXValidator` | 유효성 검증                   |

## Service 메서드 유형
- 호출하는 controller 메서드명과 동일하게 명명한다 ([api-contract](./api-contract.md) "메서드 유형" 참조)

## Finder 메서드 유형
| 유형      | 메서드명                                          |
| --------- | ------------------------------------------------- |
| 단건 조회 | `find(id)`, `findBy<조건>`                        |
| 다건 조회 | `findAll`, `findAllBy<조건>`, `findAllByIds(Collection)` |
| 조건 확인 | `existsBy<조건>`, `is<조건>`                      |

## 도메인 객체 유형
- 하위 도메인 객체 : 엔티티에 의존
- 상위 도메인 객체 : 하위 도메인에 의존