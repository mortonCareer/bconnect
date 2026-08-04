package to.bconnect.api.oneclick.infrastructure.feia;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.oneclick.OneClickUtils;
import to.bconnect.api.oneclick.domain.feia.FireLicense;
import to.bconnect.api.oneclick.storage.FeiaFireLicenseEntity;
import to.bconnect.api.oneclick.storage.FeiaFireLicenseRepository;

import java.util.List;

// 소방시설업 면허 조회 (소방청)
@Component
@RequiredArgsConstructor
public class FeiaFireLicenseFinder {

    private final FeiaFireLicenseRepository feiaFireLicenseRepository;

    @Transactional(readOnly = true)
    public List<FireLicense> list(String companyName, String ownerName) {
        return OneClickUtils.lookup(
                        companyName, feiaFireLicenseRepository::findAllByNormalizedCompanyName,
                        FeiaFireLicenseEntity::getCeoName, ownerName)
                .stream()
                .map(it -> new FireLicense(
                        it.getSeqNo(),
                        it.getCompanyName(),
                        it.getCeoName(),
                        it.getAddress(),
                        it.getBusinessType(),
                        it.getLicenseDiv(),
                        it.getPostalCode(),
                        it.getPhone(),
                        it.getRegion(),
                        it.getRegionDetail()
                ))
                .toList();
    }
}
