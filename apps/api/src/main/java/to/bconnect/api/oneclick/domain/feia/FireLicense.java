package to.bconnect.api.oneclick.domain.feia;

// 소방시설업 면허
public record FireLicense(
        Integer seqNo,        // 순번 (seq_no)
        String companyName,   // 상호 (company_name)
        String ceoName,       // 대표자 (ceo_name)
        String address,       // 본사주소 (address)
        String businessType,  // 업종 (business_type)
        String licenseDiv,    // 분야 (license_div)
        String postalCode,    // 우편번호 (postal_code)
        String phone,         // 전화번호 (phone)
        String region,        // 지역 (region)
        String regionDetail   // 조회지역 (region_detail)
) {
}
