package to.bconnect.api.oneclick.domain.moel;

import to.bconnect.api.oneclick.domain.Verdict;

import java.util.List;

// 체불사업주 결과
public record WageDefaultResult(
        Verdict verdict,
        int count,
        String name,           // 성명 (성명)
        String companyName,    // 사업장명 (사업장명)
        String arrearsAmount   // 체불액 (체불액)
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

    public static WageDefaultResult error() {
        return new WageDefaultResult(Verdict.ERROR, 0, null, null, null);
    }
}
