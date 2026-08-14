package to.bconnect.api.oneclick.domain.cwma;

import java.time.LocalDate;

// 퇴직공제 가입 공사
public record RetirementFund(
        Integer seqNo,        // 연번 (seq_no)
        String projectName,   // 공사명 (project_name)
        Long totalAmount,     // 총공사금액, 단위 원 (total_amount)
        LocalDate startDate,  // 공사시작일 (start_date)
        LocalDate endDate,    // 공사종료일 (end_date)
        String companyName,   // 업체명 (company_name)
        String clientOrg,     // 수요기관 (client_org)
        String address        // 소재지주소 (address)
) {
}
