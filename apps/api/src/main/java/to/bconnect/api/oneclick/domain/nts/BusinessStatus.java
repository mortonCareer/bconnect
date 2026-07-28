package to.bconnect.api.oneclick.domain.nts;

import java.time.LocalDate;

// 사업자 상태
public record BusinessStatus(
        TaxpayerStatus taxpayerStatus,
        LocalDate closedAt
) {
}
