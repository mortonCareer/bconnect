package to.bconnect.api.oneclick.domain.ecic;

import to.bconnect.api.oneclick.domain.Verdict;

import java.util.List;

// 전기공사업 면허 결과
public record ElectricalLicenseResult(
        Verdict verdict,
        int count,
        String registrationNo,   // 등록번호 (registrationNo)
        String companyName,      // 상호 (companyName)
        String representative    // 대표자 (representative)
) {
    public static ElectricalLicenseResult of(List<ElectricalLicense> licenses) {
        if (licenses.isEmpty())
            return new ElectricalLicenseResult(Verdict.UNKNOWN, 0, null, null, null);

        var first = licenses.getFirst();
        return new ElectricalLicenseResult(
                Verdict.CONFIRMED,
                licenses.size(),
                first.registrationNo(),
                first.companyName(),
                first.representative()
        );
    }

    public static ElectricalLicenseResult error() {
        return new ElectricalLicenseResult(Verdict.ERROR, 0, null, null, null);
    }
}
