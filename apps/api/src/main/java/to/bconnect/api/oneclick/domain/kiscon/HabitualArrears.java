package to.bconnect.api.oneclick.domain.kiscon;

// 상습체불
public record HabitualArrears(
        String seqNo,                 // 연번 (seq_no)
        String companyName,           // 법인 명칭 (company_name)
        String address,               // 법인 주소 (address)
        String representative,        // 대표자 성명 (representative)
        String representativeAge,     // 대표자 나이 (representative_age)
        String representativeAddress, // 대표자 주소 (representative_address)
        String penaltyHistory,        // 처분이력 (penalty_history)
        String penaltyDates,          // 처분일자 (penalty_dates)
        Long arrearsAmount,           // 체불금액, 단위 원 (arrears_amount)
        String publicationPeriod      // 공표기간 (publication_period)
) {
}
