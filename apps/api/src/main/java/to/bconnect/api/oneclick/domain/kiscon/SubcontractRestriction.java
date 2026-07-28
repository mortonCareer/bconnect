package to.bconnect.api.oneclick.domain.kiscon;

// 하도급 참여제한
public record SubcontractRestriction(
        String companyName,       // 상호명 (company_name)
        String representative,    // 대표자 (representative)
        String violationType,     // 위반유형 (violation_type)
        String restrictionStart,  // 제한 시작 (restriction_start)
        String restrictionEnd     // 제한 종료 (restriction_end)
) {
}
