package to.bconnect.api.oneclick.domain.kiscon;

import to.bconnect.api.oneclick.domain.Verdict;

import java.util.List;

// 상습체불 결과
public record HabitualArrearsResult(
        Verdict verdict,
        int count,
        String companyName,        // 법인 명칭 (company_name)
        String representative,     // 대표자 성명 (representative)
        Long arrearsAmount,        // 체불금액, 단위 원 (arrears_amount)
        String publicationPeriod   // 공표기간 (publication_period)
) {
    public static HabitualArrearsResult of(List<HabitualArrears> arrears) {
        if (arrears.isEmpty())
            return new HabitualArrearsResult(Verdict.CONFIRMED, 0, null, null, null, null);

        var first = arrears.getFirst();
        return new HabitualArrearsResult(
                Verdict.WARNING,
                arrears.size(),
                first.companyName(),
                first.representative(),
                first.arrearsAmount(),
                first.publicationPeriod()
        );
    }

    // 조회 키인 상호를 확보하지 못해 조회 자체가 불가한 경우
    public static HabitualArrearsResult unknown() {
        return new HabitualArrearsResult(Verdict.UNKNOWN, 0, null, null, null, null);
    }

    public static HabitualArrearsResult error() {
        return new HabitualArrearsResult(Verdict.ERROR, 0, null, null, null, null);
    }
}
