# API 패키지 제약사항

## 범위
- 컨트롤러(Controller)
- DTO

## DTO 유형

| 유형                | 설명                                  |
| ------------------- | ------------------------------------- |
| `XXXRequest`        | 요청 DTO                              |
| `XXXResponse`       | 단일 도메인 객체에 대응되는 응답 DTO |
| `XXXDetailResponse` | 둘 이상의 도메인 객체가 병합된 응답 DTO |

## 메서드 유형

| 유형      | 메서드명            | 비고                                                                        |
| --------- |-----------------|---------------------------------------------------------------------------|
| 단건 조회 | `get`           |                                                                           |
| 목록 조회 | `list`          |                                                                           |
| 생성      | `create`, 행위 동사 | `register`, `send`                                                        |
| 수정      | `update`        |                                                                           |
| 삭제      | `delete`, 행위 동사 | - `cancel`, `withdraw` <br> - `@ResponseStatus(HttpStatus.NO_CONTENT)` 필수 |
| 기타 행위 | 행위 동사           | `accept`, `deny`, `hide`, `show`                                          |