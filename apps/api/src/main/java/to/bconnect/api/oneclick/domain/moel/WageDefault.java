package to.bconnect.api.oneclick.domain.moel;

// 체불사업주
public record WageDefault(
        String period,          // 구분, 공표 회차 (period)
        String name,            // 성명 (name)
        String age,             // 나이 (age)
        String companyName,     // 사업장명 (company_name)
        String industry,        // 업종 (industry)
        String personalAddress, // 사업주 주소지 (personal_address)
        String companyAddress,  // 사업장 소재지 (company_address)
        Long arrearsAmount      // 체불액, 단위 원 (arrears_amount)
) {
}
