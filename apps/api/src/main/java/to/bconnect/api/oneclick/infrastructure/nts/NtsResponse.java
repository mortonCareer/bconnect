package to.bconnect.api.oneclick.infrastructure.nts;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

// 국세청 사업자등록 API 응답
public class NtsResponse {

    public record Validate(
            @JsonProperty("status_code") String statusCode,   // 결과코드 (status_code)
            @JsonProperty("request_cnt") Integer requestCnt,   // 요청 건수 (request_cnt)
            List<ValidateItem> data                            // 결과 목록 (data)
    ) {}

    public record ValidateItem(
            @JsonProperty("b_no") String bNo,                        // 사업자등록번호 (b_no)
            @JsonProperty("valid") String valid,                     // 진위 판정, 01이 일치 (valid)
            @JsonProperty("valid_msg") String validMsg,              // 판정 메시지 (valid_msg)
            @JsonProperty("request_param") RequestParam requestParam // 요청 파라미터 반향 (request_param)
    ) {}

    public record RequestParam(
            @JsonProperty("b_no") String bNo,           // 사업자등록번호 (b_no)
            @JsonProperty("start_dt") String startDt,   // 개업일자 (start_dt)
            @JsonProperty("p_nm") String pNm,           // 대표자명 (p_nm)
            @JsonProperty("p_nm2") String pNm2,         // 외국인 대표자명 (p_nm2)
            @JsonProperty("b_nm") String bNm,           // 상호 (b_nm)
            @JsonProperty("corp_no") String corpNo,     // 법인등록번호 (corp_no)
            @JsonProperty("b_sector") String bSector,   // 주업태명 (b_sector)
            @JsonProperty("b_type") String bType,       // 주종목명 (b_type)
            @JsonProperty("b_adr") String bAdr          // 사업장 주소 (b_adr)
    ) {}

    public record Status(
            @JsonProperty("status_code") String statusCode,   // 결과코드 (status_code)
            @JsonProperty("match_cnt") Integer matchCnt,      // 조회 성공 건수 (match_cnt)
            @JsonProperty("request_cnt") Integer requestCnt,  // 요청 건수 (request_cnt)
            List<StatusItem> data                             // 결과 목록 (data)
    ) {}

    public record StatusItem(
            @JsonProperty("b_no") String bNo,                             // 사업자등록번호 (b_no)
            @JsonProperty("b_stt") String bStt,                           // 납세자 상태 (b_stt)
            @JsonProperty("b_stt_cd") String bSttCd,                      // 납세자 상태코드 (b_stt_cd)
            @JsonProperty("tax_type") String taxType,                     // 과세유형 (tax_type)
            @JsonProperty("tax_type_cd") String taxTypeCd,                // 과세유형 코드 (tax_type_cd)
            @JsonProperty("end_dt") String endDt,                         // 폐업일자 (end_dt)
            @JsonProperty("utcc_yn") String utccYn,                       // 단위과세 전환폐업 여부 (utcc_yn)
            @JsonProperty("tax_type_change_dt") String taxTypeChangeDt,   // 과세유형 전환일자 (tax_type_change_dt)
            @JsonProperty("invoice_apply_dt") String invoiceApplyDt,      // 세금계산서 적용일자 (invoice_apply_dt)
            @JsonProperty("rbf_tax_type") String rbfTaxType,              // 직전 과세유형 (rbf_tax_type)
            @JsonProperty("rbf_tax_type_cd") String rbfTaxTypeCd          // 직전 과세유형 코드 (rbf_tax_type_cd)
    ) {}
}
