package to.bconnect.api.oneclick.infrastructure.moel;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.oneclick.OneClickUtils;
import to.bconnect.api.oneclick.domain.moel.WageDefault;
import to.bconnect.api.oneclick.storage.MoelWageDefaultEntity;
import to.bconnect.api.oneclick.storage.MoelWageDefaultRepository;

import java.util.List;

// 체불사업주 조회 (고용노동부)
@Component
@RequiredArgsConstructor
public class MoelWageDefaultFinder {

    private final MoelWageDefaultRepository moelWageDefaultRepository;

    @Transactional(readOnly = true)
    public List<WageDefault> list(String companyName, String ownerName) {
        return OneClickUtils.lookup(
                        companyName, moelWageDefaultRepository::findAllByNormalizedCompanyName,
                        MoelWageDefaultEntity::getName, ownerName)
                .stream()
                .map(it -> new WageDefault(
                        it.getPeriod(),
                        it.getName(),
                        it.getAge(),
                        it.getCompanyName(),
                        it.getIndustry(),
                        it.getPersonalAddress(),
                        it.getCompanyAddress(),
                        OneClickUtils.parseWon(it.getArrearsAmount())
                ))
                .toList();
    }
}
