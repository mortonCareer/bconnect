package to.bconnect.api.oneclick.domain.feia;

// 소방시설업 면허
public record FireLicense(
        String companyName,   // 업체명 (entprsNameHangul)
        String ceoName,       // 대표자 (ceoName)
        String address,       // 주소 (hdOffcAddr1)
        String licenseName,   // 등록번호 (licenseName)
        String licenseDiv     // 구분 (licenseDiv)
) {
}
