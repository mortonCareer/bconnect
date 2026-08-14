package to.bconnect.api.oneclick.domain.nts;

import java.time.LocalDate;

// 사업자 상태
public record BusinessStatus(
        TaxpayerStatus bSttCd,   // 납세자 상태코드 (b_stt_cd)
        LocalDate endDt          // 폐업일자 (end_dt)
) {
}
