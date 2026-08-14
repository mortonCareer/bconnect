package to.bconnect.api.oneclick.infrastructure.kiscon;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.oneclick.OneClickUtils;
import to.bconnect.api.oneclick.domain.kiscon.HabitualArrears;
import to.bconnect.api.oneclick.storage.KisconArrearsEntity;
import to.bconnect.api.oneclick.storage.KisconArrearsRepository;

import java.util.List;

// 상습체불 조회 (키스콘)
@Component
@RequiredArgsConstructor
public class KisconArrearsFinder {

    private final KisconArrearsRepository kisconArrearsRepository;

    @Transactional(readOnly = true)
    public List<HabitualArrears> list(String companyName, String ownerName) {
        return OneClickUtils.lookup(
                        companyName, kisconArrearsRepository::findAllByNormalizedCompanyName,
                        KisconArrearsEntity::getRepresentative, ownerName)
                .stream()
                .map(it -> new HabitualArrears(
                        it.getSeqNo(),
                        it.getCompanyName(),
                        it.getAddress(),
                        it.getRepresentative(),
                        it.getRepresentativeAge(),
                        it.getRepresentativeAddress(),
                        it.getPenaltyHistory(),
                        it.getPenaltyDates(),
                        OneClickUtils.fromThousandWon(it.getArrearsAmount()),
                        it.getPublicationPeriod()
                ))
                .toList();
    }
}
