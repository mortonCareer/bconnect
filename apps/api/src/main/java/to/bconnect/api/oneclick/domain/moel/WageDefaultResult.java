package to.bconnect.api.oneclick.domain.moel;

import to.bconnect.api.oneclick.domain.Verdict;

import java.util.List;

// 체불사업주 결과
public record WageDefaultResult(
        Verdict verdict,
        int count,
        String name,           // 성명 (name)
        String companyName,    // 사업장명 (company_name)
        Long arrearsAmount     // 체불액, 단위 원 (arrears_amount)
) {
    public static WageDefaultResult of(List<WageDefault> defaults) {
        if (defaults.isEmpty())
            return new WageDefaultResult(Verdict.CONFIRMED, 0, null, null, null);

        var first = defaults.getFirst();
        return new WageDefaultResult(
                Verdict.WARNING,
                defaults.size(),
                first.name(),
                first.companyName(),
                first.arrearsAmount()
        );
    }

    // 조회 키인 상호를 확보하지 못해 조회 자체가 불가한 경우
    public static WageDefaultResult unknown() {
        return new WageDefaultResult(Verdict.UNKNOWN, 0, null, null, null);
    }

    public static WageDefaultResult error() {
        return new WageDefaultResult(Verdict.ERROR, 0, null, null, null);
    }
}
