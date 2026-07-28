package to.bconnect.api.oneclick.domain.kiscon;

import to.bconnect.api.oneclick.domain.Verdict;

import java.util.List;

// 하도급 참여제한 결과
public record SubcontractRestrictionResult(
        Verdict verdict,
        int count,
        String companyName,       // 상호명 (company_name)
        String representative,    // 대표자 (representative)
        String violationType,     // 위반유형 (violation_type)
        String restrictionStart,  // 제한 시작 (restriction_start)
        String restrictionEnd     // 제한 종료 (restriction_end)
) {
    public static SubcontractRestrictionResult of(List<SubcontractRestriction> restrictions) {
        if (restrictions.isEmpty())
            return new SubcontractRestrictionResult(Verdict.CONFIRMED, 0, null, null, null, null, null);

        var first = restrictions.getFirst();
        return new SubcontractRestrictionResult(
                Verdict.WARNING,
                restrictions.size(),
                first.companyName(),
                first.representative(),
                first.violationType(),
                first.restrictionStart(),
                first.restrictionEnd()
        );
    }

    public static SubcontractRestrictionResult error() {
        return new SubcontractRestrictionResult(Verdict.ERROR, 0, null, null, null, null, null);
    }
}
