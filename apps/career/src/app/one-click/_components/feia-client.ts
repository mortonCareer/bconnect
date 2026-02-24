import 'server-only'

/**
 * 한국소방시설협회(FEIA) 소방시설업체 조회
 * JSON API: https://feia.ekffa.or.kr/compSearch/complist.json
 */

export interface FeiaCompanyItem {
  entprsNameHangul: string // 업체명
  ceoName: string // 대표자
  hdOffcAddr1: string // 주소
  hdOffcTelNo: string // 전화번호
  licenseName: string // 등록번호
  licenseDiv: string // 구분 (전문/일반)
  upKindcode: string // 업종코드 (10=공사, 20=설계, 30=감리, 50=방염)
  compManageNo: string // 관리번호
}

interface FeiaApiResponse {
  code: number
  data: {
    list: FeiaCompanyItem[]
    totalCount?: number
  }
}

const FEIA_API_URL = 'https://feia.ekffa.or.kr/compSearch/complist.json'

/**
 * FEIA 소방시설업체 검색 (회사명 기준)
 *
 * @param companyName 업체명 (KCOMWEL에서 가져온 사업장명)
 * @returns 매칭되는 업체 목록 (없으면 빈 배열)
 */
export async function fetchFeiaCompanies(companyName: string): Promise<FeiaCompanyItem[]> {
  const url = new URL(FEIA_API_URL)
  url.searchParams.set('entprsNameHangul', companyName)
  url.searchParams.set('pageNo', '1')
  url.searchParams.set('pageSize', '10')

  const response = await fetch(url.toString(), {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`FEIA API error: ${response.status} ${response.statusText}`)
  }

  const json: FeiaApiResponse = await response.json()

  if (json.code !== 0) {
    throw new Error(`FEIA API returned error code: ${json.code}`)
  }

  return json.data?.list ?? []
}
