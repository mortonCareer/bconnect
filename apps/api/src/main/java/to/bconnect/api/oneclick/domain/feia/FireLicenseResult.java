package to.bconnect.api.oneclick.domain.feia;

import to.bconnect.api.oneclick.domain.Verdict;

import java.util.List;

// 소방시설업 면허 결과
public record FireLicenseResult(
        Verdict verdict,
        int count,
        String companyName,   // 업체명 (entprsNameHangul)
        String ceoName,       // 대표자 (ceoName)
        String licenseName,   // 등록번호 (licenseName)
        String licenseDiv     // 구분 (licenseDiv)
) {
    public static FireLicenseResult of(List<FireLicense> licenses) {
        if (licenses.isEmpty())
            return new FireLicenseResult(Verdict.UNKNOWN, 0, null, null, null, null);

        var first = licenses.getFirst();
        return new FireLicenseResult(
                Verdict.CONFIRMED,
                licenses.size(),
                first.companyName(),
                first.ceoName(),
                first.licenseName(),
                first.licenseDiv()
        );
    }

    public static FireLicenseResult error() {
        return new FireLicenseResult(Verdict.ERROR, 0, null, null, null, null);
    }
}
