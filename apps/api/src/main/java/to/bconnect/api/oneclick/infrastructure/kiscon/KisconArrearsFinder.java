package to.bconnect.api.oneclick.infrastructure.kiscon;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.oneclick.domain.kiscon.HabitualArrears;
import to.bconnect.api.oneclick.storage.KisconArrearsRepository;

import java.util.List;

// 상습체불 조회 (키스콘)
@Component
@RequiredArgsConstructor
public class KisconArrearsFinder {

    private final KisconArrearsRepository kisconArrearsRepository;

    @Transactional(readOnly = true)
    public List<HabitualArrears> list(String companyName) {
        if (companyName == null || companyName.isBlank())
            return List.of();

        val normalized = companyName.replaceAll("\\s", "");
        return kisconArrearsRepository.findAll()
                .stream()
                .filter(it -> matches(it.getCompanyName(), normalized))
                .map(it -> new HabitualArrears(
                        it.getCompanyName(),
                        it.getRepresentative(),
                        it.getArrearsAmount(),
                        it.getPenaltyHistory(),
                        it.getPublicationPeriod()
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
