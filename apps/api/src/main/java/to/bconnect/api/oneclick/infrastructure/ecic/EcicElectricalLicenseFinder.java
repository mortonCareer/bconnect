package to.bconnect.api.oneclick.infrastructure.ecic;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.oneclick.domain.ecic.ElectricalLicense;
import to.bconnect.api.oneclick.storage.EcicElectricalLicenseRepository;

import java.util.List;

// 전기공사업 면허 조회 (한국전기공사협회)
@Component
@RequiredArgsConstructor
public class EcicElectricalLicenseFinder {

    private final EcicElectricalLicenseRepository ecicElectricalLicenseRepository;

    @Transactional(readOnly = true)
    public List<ElectricalLicense> list(String companyName) {
        if (companyName == null || companyName.isBlank())
            return List.of();

        return ecicElectricalLicenseRepository.findAllByCompanyNameContaining(stripCorp(companyName))
                .stream()
                .map(it -> new ElectricalLicense(
                        it.getRegistrationNo(),
                        it.getCompanyName(),
                        it.getRepresentative(),
                        it.getAddress()
                ))
                .toList();
    }

    // 법인격 표기 제거 후 상호 부분일치 (사업자번호 미제공 → 이름 기반)
    private static String stripCorp(String name) {
        val stripped = name
                .replaceAll("\\(주\\)|\\(유\\)|\\(합\\)|\\(사\\)", "")
                .replace("주식회사", "")
                .replace("유한회사", "");
        return stripped.trim();
    }
}
