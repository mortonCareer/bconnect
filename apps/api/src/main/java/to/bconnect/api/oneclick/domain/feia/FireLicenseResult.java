package to.bconnect.api.oneclick.domain.feia;

import to.bconnect.api.oneclick.domain.Verdict;

import java.util.List;

// 소방시설업 면허 결과
public record FireLicenseResult(
        Verdict verdict,
        int count,
        String companyName,   // 상호 (company_name)
        String ceoName,       // 대표자 (ceo_name)
        String businessType,  // 업종 (business_type)
        String licenseDiv     // 분야 (license_div)
) {
    public static FireLicenseResult of(List<FireLicense> licenses) {
        if (licenses.isEmpty())
            return unknown();

        var first = licenses.getFirst();
        return new FireLicenseResult(
                Verdict.CONFIRMED,
                licenses.size(),
                first.companyName(),
                first.ceoName(),
                first.businessType(),
                first.licenseDiv()
        );
    }

    // 조회 키인 상호를 확보하지 못해 조회 자체가 불가한 경우
    public static FireLicenseResult unknown() {
        return new FireLicenseResult(Verdict.UNKNOWN, 0, null, null, null, null);
    }

    public static FireLicenseResult error() {
        return new FireLicenseResult(Verdict.ERROR, 0, null, null, null, null);
    }
}
