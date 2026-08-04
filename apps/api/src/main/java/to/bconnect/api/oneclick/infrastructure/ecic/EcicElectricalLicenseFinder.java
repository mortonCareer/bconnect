package to.bconnect.api.oneclick.infrastructure.ecic;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.oneclick.OneClickUtils;
import to.bconnect.api.oneclick.domain.ecic.ElectricalLicense;
import to.bconnect.api.oneclick.storage.EcicElectricalLicenseEntity;
import to.bconnect.api.oneclick.storage.EcicElectricalLicenseRepository;

import java.util.List;

// 전기공사업 면허 조회 (한국전기공사협회)
@Component
@RequiredArgsConstructor
public class EcicElectricalLicenseFinder {

    private final EcicElectricalLicenseRepository ecicElectricalLicenseRepository;

    @Transactional(readOnly = true)
    public List<ElectricalLicense> list(String companyName, String ownerName) {
        return OneClickUtils.lookup(
                        companyName, ecicElectricalLicenseRepository::findAllByNormalizedCompanyName,
                        EcicElectricalLicenseEntity::getRepresentative, ownerName)
                .stream()
                .map(it -> new ElectricalLicense(
                        it.getRegistrationNo(),
                        it.getCompanyName(),
                        it.getRepresentative(),
                        it.getAddress()
                ))
                .toList();
    }
}
