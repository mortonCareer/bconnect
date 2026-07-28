package to.bconnect.api.oneclick.domain.cwma;

import to.bconnect.api.oneclick.domain.Verdict;

import java.util.List;

// 퇴직공제 결과
public record RetirementFundResult(
        Verdict verdict,
        int count,
        String projectName,   // 공사명 (project_name)
        Long totalAmount,     // 총공사금액 (total_amount)
        String startDate,     // 공사 시작일 (start_date)
        String endDate,       // 공사 종료일 (end_date)
        String clientOrg      // 발주처 (client_org)
) {
    public static RetirementFundResult of(List<RetirementFund> projects) {
        if (projects.isEmpty())
            return new RetirementFundResult(Verdict.UNKNOWN, 0, null, null, null, null, null);

        var first = projects.getFirst();
        return new RetirementFundResult(
                Verdict.CONFIRMED,
                projects.size(),
                first.projectName(),
                first.totalAmount(),
                first.startDate(),
                first.endDate(),
                first.clientOrg()
        );
    }

    public static RetirementFundResult error() {
        return new RetirementFundResult(Verdict.ERROR, 0, null, null, null, null, null);
    }
}
