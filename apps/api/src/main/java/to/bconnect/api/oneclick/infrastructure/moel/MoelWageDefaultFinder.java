package to.bconnect.api.oneclick.infrastructure.moel;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.oneclick.domain.moel.WageDefault;
import to.bconnect.api.oneclick.storage.MoelWageDefaultRepository;

import java.util.List;

// 체불사업주 조회 (고용노동부)
@Component
@RequiredArgsConstructor
public class MoelWageDefaultFinder {

    private final MoelWageDefaultRepository moelWageDefaultRepository;

    @Transactional(readOnly = true)
    public List<WageDefault> list(String companyName) {
        if (companyName == null || companyName.isBlank())
            return List.of();

        val normalized = companyName.replaceAll("\\s", "");
        return moelWageDefaultRepository.findAll()
                .stream()
                .filter(it -> matches(it.getCompanyName(), normalized))
                .map(it -> new WageDefault(
                        it.getName(),
                        it.getCompanyName(),
                        it.getIndustry(),
                        it.getArrearsAmount(),
                        it.getCompanyAddress()
                ))
                .toList();
    }

    private static boolean matches(String candidate, String normalized) {
        if (candidate == null)
            return false;
        val itemName = candidate.replaceAll("\\s", "");
        return itemName.contains(normalized) || normalized.contains(itemName);
    }
}
