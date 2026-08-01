package to.bconnect.api.oneclick.infrastructure.feia;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.oneclick.domain.feia.FireLicense;
import to.bconnect.api.oneclick.storage.FeiaFireLicenseRepository;

import java.util.List;

// 소방시설업 면허 조회 (소방청)
@Component
@RequiredArgsConstructor
public class FeiaFireLicenseFinder {

    private final FeiaFireLicenseRepository feiaFireLicenseRepository;

    @Transactional(readOnly = true)
    public List<FireLicense> list(String companyName) {
        if (companyName == null || companyName.isBlank())
            return List.of();

        return feiaFireLicenseRepository.findAllByCompanyNameContaining(strip(companyName))
                .stream()
                .map(it -> new FireLicense(
                        it.getCompanyName(),
                        it.getCeoName(),
                        it.getAddress(),
                        it.getBusinessType(),
                        it.getLicenseDiv()
                ))
                .toList();
    }

    // 법인격 표기 제거 후 상호 일치
    private static String strip(String name) {
        return name.replaceAll("\\(주\\)|（주）|주식회사", "").trim();
    }
}
