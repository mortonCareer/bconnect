package to.bconnect.api.oneclick.domain.kiscon;

import to.bconnect.api.oneclick.domain.Verdict;

import java.time.LocalDate;
import java.util.List;

// 하도급 참여제한 결과
public record SubcontractRestrictionResult(
        Verdict verdict,
        int count,
        String companyName,          // 상호 (company_name)
        String representative,       // 대표자 (representative)
        String violationType,        // 위반법령 (violation_type)
        LocalDate restrictionStart,  // 하도급참여제한 시작일 (restriction_start)
        LocalDate restrictionEnd     // 하도급참여제한 종료일 (restriction_end)
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
