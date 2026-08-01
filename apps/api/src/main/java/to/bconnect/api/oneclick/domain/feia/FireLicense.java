package to.bconnect.api.oneclick.domain.feia;

// 소방시설업 면허
public record FireLicense(
        String companyName,   // 상호 (companyName)
        String ceoName,       // 대표자 (ceoName)
        String address,       // 본사주소 (address)
        String businessType,  // 업종 (businessType)
        String licenseDiv     // 분야 (licenseDiv)
) {
}
