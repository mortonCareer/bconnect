package to.bconnect.api.oneclick.domain.cwma;

import to.bconnect.api.oneclick.domain.Verdict;

import java.time.LocalDate;
import java.util.List;

// 퇴직공제 결과
public record RetirementFundResult(
        Verdict verdict,
        int count,
        String projectName,   // 공사명 (project_name)
        Long totalAmount,     // 총공사금액, 단위 원 (total_amount)
        LocalDate startDate,  // 공사시작일 (start_date)
        LocalDate endDate,    // 공사종료일 (end_date)
        String clientOrg      // 수요기관 (client_org)
) {
    public static RetirementFundResult of(List<RetirementFund> projects) {
        if (projects.isEmpty())
            return unknown();

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

    // 조회 키인 상호를 확보하지 못해 조회 자체가 불가한 경우
    public static RetirementFundResult unknown() {
        return new RetirementFundResult(Verdict.UNKNOWN, 0, null, null, null, null, null);
    }

    public static RetirementFundResult error() {
        return new RetirementFundResult(Verdict.ERROR, 0, null, null, null, null, null);
    }
}
