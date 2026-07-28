package to.bconnect.api.oneclick.domain.kiscon;

// 상습체불
public record HabitualArrears(
        String companyName,        // 업체명 (company_name)
        String representative,     // 대표자 (representative)
        String arrearsAmount,      // 체불금액 (arrears_amount)
        String penaltyHistory,     // 처분이력 (penalty_history)
        String publicationPeriod   // 공표기간 (publication_period)
) {
}
