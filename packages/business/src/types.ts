/** 검사 항목 카테고리 */
export type CheckCategory = 'BUSINESS_LICENSE' | 'WAGE_RESTRICTION' | 'INSURANCE'

/** 검사 항목 ID */
export type CheckItemId =
  | 'BUSINESS_STATUS'
  | 'CONSTRUCTION_LICENSE'
  | 'SPECIALTY_LICENSE'
  | 'ELECTRICAL_LICENSE'
  | 'FIRE_LICENSE'
  | 'WAGE_ARREARS'
  | 'HABITUAL_ARREARS'
  | 'SUBCONTRACT_RESTRICTION'
  | 'RETIREMENT_FUND'
  | 'EMPLOYMENT_INSURANCE'

/** 상태 유형 (배지 색상 결정) */
export type StatusType = 'positive' | 'neutral' | 'negative' | 'error'

/** 상세 정보 key-value */
export interface CheckDetail {
  key: string
  value: string
}

/** 개별 검사 항목 */
export interface CheckItem {
  id: CheckItemId
  category: CheckCategory
  label: string
  source: string
  status: string
  statusType: StatusType
  details: CheckDetail[]
  description?: string
  externalUrl?: string
}

/** 회사 정보 */
export interface CompanyInfo {
  name: string
  registrationNumber: string
}

/** 조회 응답 전체 */
export interface VerifyBusinessResult {
  company: CompanyInfo
  checkItems: CheckItem[]
}

/** 카테고리 그룹 정의 (UI 렌더링용) */
export interface CategoryGroup {
  id: CheckCategory
  label: string
  itemIds: CheckItemId[]
}

/** 진위확인 응답 */
export interface VerifyOwnerResult {
  valid: boolean
  message: string
}

// ─── 국세청 API Types ───────────────────────────

/** 상태조회 개별 응답 항목 */
export interface NtsStatusItem {
  b_no: string
  b_stt: string
  b_stt_cd: string
  tax_type: string
  tax_type_cd: string
  end_dt: string
  utcc_yn: string
  tax_type_change_dt: string
  invoice_apply_dt: string
  rbf_tax_type: string
  rbf_tax_type_cd: string
}

/** 상태조회 API 응답 */
export interface NtsStatusResponse {
  status_code: string
  match_cnt: number
  request_cnt: number
  data: NtsStatusItem[]
}

/** 진위확인 요청 개별 항목 */
export interface NtsValidateBusinessItem {
  b_no: string
  start_dt: string
  p_nm: string
  p_nm2?: string
  b_nm?: string
  corp_no?: string
  b_sector?: string
  b_type?: string
  b_adr?: string
}

/** 진위확인 개별 응답 항목 */
export interface NtsValidateItem {
  b_no: string
  valid: string
  valid_msg: string
  request_param: NtsValidateBusinessItem
}

/** 진위확인 API 응답 */
export interface NtsValidateResponse {
  status_code: string
  match_cnt: number
  request_cnt: number
  data: NtsValidateItem[]
}

// ─── 근로복지공단 API Types ──────────────────────

/** 고용/산재보험 가입 사업장 조회 응답 항목 */
export interface KcomwelInsuranceItem {
  saeopjangNm: string // 사업장명
  addr: string // 주소
  sangsiInwonCnt: string // 상시근로자수
  seongripDt: string // 성립일자 (YYYYMMDD)
  saeopjaDrno: string // 사업자등록번호
  opaBoheomFg: string // 보험구분 (1=산재, 2=고용)
  post: string // 우편번호
  saeopFg?: string // 사업장구분
  sjEopjongCd?: string // 산재보험 업종코드
  sjEopjongNm?: string // 산재보험 업종명
  gyEopjongCd?: string // 고용보험 업종코드
  gyEopjongNm?: string // 고용보험 업종명
}

// ─── KISCON 건설업체정보 API Types ───────────────

/** 건설업체등록 레코드 (kiscon_registration 테이블) */
export interface KisconRegistrationItem {
  ncr_gs_seq: number
  ncr_master_num: string
  ncr_gs_kname: string | null
  ncr_gs_master: string | null
  ncr_item_name: string | null
  ncr_itemregno: string | null
  ncr_gs_addr: string | null
  ncr_area_name: string | null
  ncr_area_detail_name: string | null
  ncr_gs_date: number | null
  ncr_gs_regdate: number | null
  ncr_gs_flag: string | null
  ncr_off_tel: string | null
  synced_at: string
}

/** 행정처분 레코드 (kiscon_admin_penalty 테이블) */
export interface KisconAdminPenaltyItem {
  ncr_gs_seq: number
  ncr_master_num: string
  ncr_admi_kname: string | null
  ncr_admi_master: string | null
  ncr_item_name: string | null
  ncr_itemregno: string | null
  ncr_admi_addr: string | null
  ncr_area_name: string | null
  ncr_area_detail_name: string | null
  ncr_admi_dename: string | null
  ecode_admi_con: string | null
  ncr_admi_reason: string | null
  ecode_admi_ground: string | null
  ncr_admi_fine: number
  ncr_admi_penalty: number
  ncr_admi_stop_sdate: string | null
  ncr_admi_stop_edate: string | null
  ncr_admi_canceldate: string | null
  ncr_admi_correct: string | null
  ncr_gs_date: number | null
  ncr_gs_regdate: number | null
  ncr_gs_flag: string | null
  ncr_off_tel: string | null
  ncr_pd_status: string | null
  synced_at: string
}
