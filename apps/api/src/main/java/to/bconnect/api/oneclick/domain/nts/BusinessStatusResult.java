package to.bconnect.api.oneclick.domain.nts;

import to.bconnect.api.oneclick.domain.Verdict;

import java.time.LocalDate;

// 사업자 상태 결과
public record BusinessStatusResult(
        Verdict verdict,
        TaxpayerStatus taxpayerStatus,
        LocalDate closedAt
) {
    public static BusinessStatusResult of(BusinessStatus status) {
        return new BusinessStatusResult(
                verdictOf(status.taxpayerStatus()),
                status.taxpayerStatus(),
                status.closedAt()
        );
    }

    public static BusinessStatusResult error() {
        return new BusinessStatusResult(Verdict.ERROR, TaxpayerStatus.UNKNOWN, null);
    }

    private static Verdict verdictOf(TaxpayerStatus status) {
        return switch (status) {
            case CONTINUING -> Verdict.CONFIRMED;
            case SUSPENDED, CLOSED -> Verdict.WARNING;
            case UNKNOWN -> Verdict.UNKNOWN;
        };
    }
}
