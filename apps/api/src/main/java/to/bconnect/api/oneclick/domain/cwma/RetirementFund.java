package to.bconnect.api.oneclick.domain.cwma;

// 퇴직공제 가입 공사
public record RetirementFund(
        String projectName,   // 공사명 (project_name)
        Long totalAmount,     // 총공사금액 (total_amount)
        String startDate,     // 공사 시작일 (start_date)
        String endDate,       // 공사 종료일 (end_date)
        String clientOrg      // 발주처 (client_org)
) {
}
