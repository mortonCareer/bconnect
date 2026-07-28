package to.bconnect.api.oneclick.domain.ecic;

// 전기공사업 면허
public record ElectricalLicense(
        String registrationNo,   // 등록번호 (registrationNo)
        String companyName,      // 상호 (companyName)
        String representative,   // 대표자 (representative)
        String address           // 소재지 (address)
) {
}
