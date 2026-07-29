import type { Address, Region } from '@bconnect/api-client'

/** mock 주소. 화면은 state(지역 필터)·city(표시)·street 만 읽는다. 위경도는 config/address 와 같은 placeholder 0. */
export function addressOf(
  state: Region,
  city: string,
  street = '',
  detail?: string,
  zipcode = '00000'
): Address {
  return {
    zipcode,
    state,
    city,
    street,
    detail,
    latitude: 0,
    longitude: 0,
  }
}
