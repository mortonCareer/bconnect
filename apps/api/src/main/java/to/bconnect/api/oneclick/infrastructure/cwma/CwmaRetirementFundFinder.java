package to.bconnect.api.oneclick.infrastructure.cwma;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.oneclick.OneClickUtils;
import to.bconnect.api.oneclick.domain.cwma.RetirementFund;
import to.bconnect.api.oneclick.storage.CwmaRetirementFundRepository;

import java.util.List;

// 퇴직공제 가입 공사 조회 (건설근로자공제회)
@Component
@RequiredArgsConstructor
public class CwmaRetirementFundFinder {

    private final CwmaRetirementFundRepository cwmaRetirementFundRepository;

    @Transactional(readOnly = true)
    public List<RetirementFund> list(String companyName) {
        return OneClickUtils.lookup(companyName, cwmaRetirementFundRepository::findAllByNormalizedCompanyName)
                .stream()
                .map(it -> new RetirementFund(
                        it.getSeqNo(),
                        it.getProjectName(),
                        OneClickUtils.fromHundredMillionWon(it.getTotalAmount()),
                        it.getStartDate(),
                        it.getEndDate(),
                        it.getCompanyName(),
                        it.getClientOrg(),
                        it.getAddress()
                ))
                .toList();
    }
}
