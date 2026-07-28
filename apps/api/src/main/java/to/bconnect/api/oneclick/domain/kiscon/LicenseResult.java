package to.bconnect.api.oneclick.domain.kiscon;

import to.bconnect.api.oneclick.domain.Verdict;

import lombok.val;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

// 건설업 면허 결과
public record LicenseResult(
        Verdict verdict,
        int count,
        List<String> tradeNames,
        LocalDate registeredAt,
        int dispositionCount
) {
    public static LicenseResult of(ConstructionBusinessType type,
                                   List<License> licenses,
                                   List<Disposition> dispositions) {
        val filtered = licenses.stream()
                .filter(it -> it.type() == type)
                .toList();

        val tradeNames = filtered.stream()
                .map(License::tradeName)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        val registeredAt = filtered.stream()
                .map(License::registeredAt)
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(null);

        val dispositionCount = (int) dispositions.stream()
                .filter(it -> it.type() == type)
                .count();

        return new LicenseResult(
                verdictOf(filtered.size(), dispositionCount),
                filtered.size(),
                tradeNames,
                registeredAt,
                dispositionCount
        );
    }

    public static LicenseResult error() {
        return new LicenseResult(Verdict.ERROR, 0, List.of(), null, 0);
    }

    private static Verdict verdictOf(int count, int dispositionCount) {
        if (count == 0)
            return Verdict.UNKNOWN;
        return dispositionCount > 0 ? Verdict.WARNING : Verdict.CONFIRMED;
    }
}
