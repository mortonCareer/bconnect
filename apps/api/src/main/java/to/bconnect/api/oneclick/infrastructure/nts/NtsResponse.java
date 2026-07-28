package to.bconnect.api.oneclick.infrastructure.nts;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

// 국세청 사업자등록 API 응답
public class NtsResponse {

    public record Validate(
            @JsonProperty("status_code") String statusCode,
            @JsonProperty("request_cnt") Integer requestCnt,
            List<ValidateItem> data
    ) {}

    public record ValidateItem(
            @JsonProperty("b_no") String bNo,
            @JsonProperty("valid") String valid,
            @JsonProperty("valid_msg") String validMsg,
            @JsonProperty("request_param") RequestParam requestParam
    ) {}

    public record RequestParam(
            @JsonProperty("b_no") String bNo,
            @JsonProperty("start_dt") String startDt,
            @JsonProperty("p_nm") String pNm,
            @JsonProperty("p_nm2") String pNm2,
            @JsonProperty("b_nm") String bNm,
            @JsonProperty("corp_no") String corpNo,
            @JsonProperty("b_sector") String bSector,
            @JsonProperty("b_type") String bType,
            @JsonProperty("b_adr") String bAdr
    ) {}

    public record Status(
            @JsonProperty("status_code") String statusCode,
            @JsonProperty("match_cnt") Integer matchCnt,
            @JsonProperty("request_cnt") Integer requestCnt,
            List<StatusItem> data
    ) {}

    public record StatusItem(
            @JsonProperty("b_no") String bNo,
            @JsonProperty("b_stt") String bStt,
            @JsonProperty("b_stt_cd") String bSttCd,
            @JsonProperty("tax_type") String taxType,
            @JsonProperty("tax_type_cd") String taxTypeCd,
            @JsonProperty("end_dt") String endDt,
            @JsonProperty("utcc_yn") String utccYn,
            @JsonProperty("tax_type_change_dt") String taxTypeChangeDt,
            @JsonProperty("invoice_apply_dt") String invoiceApplyDt,
            @JsonProperty("rbf_tax_type") String rbfTaxType,
            @JsonProperty("rbf_tax_type_cd") String rbfTaxTypeCd
    ) {}
}
