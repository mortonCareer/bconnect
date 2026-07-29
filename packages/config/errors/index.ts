// 공용 도메인 에러 SSoT — 에러 클래스와 사용자 노출 카피를 한 곳에서 정의한다 (#1000 리뷰).

/** 시/도 정확 일치 실패 — 주소 입력(쓰기)은 저장 차단, 호출부가 잡아 에러 표시 (#1000) */
export class UnknownSidoError extends Error {
  constructor(public readonly sido: string) {
    super(`인식할 수 없는 시/도 표기: ${sido}`)
    this.name = 'UnknownSidoError'
  }
}

/** UnknownSidoError 사용자 노출 카피 — career(AddressField)·plan(schedule-header) 공유 */
export const UNKNOWN_SIDO_MESSAGE = '주소의 시/도를 인식할 수 없습니다. 주소를 다시 검색해주세요.'
