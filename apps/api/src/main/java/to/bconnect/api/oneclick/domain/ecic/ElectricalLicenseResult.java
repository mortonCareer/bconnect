package to.bconnect.api.oneclick.domain.ecic;

import to.bconnect.api.oneclick.domain.Verdict;

import java.util.List;

// 전기공사업 면허 결과
public record ElectricalLicenseResult(
        Verdict verdict,
        int count,
        String registrationNo,   // 등록번호 (registration_no)
        String companyName,      // 상호 (company_name)
        String representative    // 대표자 (representative)
) {
    public static ElectricalLicenseResult of(List<ElectricalLicense> licenses) {
        if (licenses.isEmpty())
            return unknown();

        var first = licenses.getFirst();
        return new ElectricalLicenseResult(
                Verdict.CONFIRMED,
                licenses.size(),
                first.registrationNo(),
                first.companyName(),
                first.representative()
        );
    }

    // 조회 키인 상호를 확보하지 못해 조회 자체가 불가한 경우
    public static ElectricalLicenseResult unknown() {
        return new ElectricalLicenseResult(Verdict.UNKNOWN, 0, null, null, null);
    }

    public static ElectricalLicenseResult error() {
        return new ElectricalLicenseResult(Verdict.ERROR, 0, null, null, null);
    }
}
