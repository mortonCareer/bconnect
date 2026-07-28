package to.bconnect.api.oneclick.infrastructure.cwma;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.oneclick.domain.cwma.RetirementFund;
import to.bconnect.api.oneclick.storage.CwmaRetirementFundRepository;

import java.time.LocalDate;
import java.util.List;

// 퇴직공제 가입사업장 조회 (건설근로자공제회)
@Component
@RequiredArgsConstructor
public class CwmaRetirementFinder {

    private final CwmaRetirementFundRepository cwmaRetirementFundRepository;

    @Transactional(readOnly = true)
    public List<RetirementFund> list(String companyName) {
        if (companyName == null || companyName.isBlank())
            return List.of();

        return cwmaRetirementFundRepository.findAllByNormalizedCompanyName(normalize(companyName))
                .stream()
                .map(it -> new RetirementFund(
                        it.getProjectName(),
                        it.getTotalAmount() == null ? null : it.getTotalAmount().longValue(),
                        toText(it.getStartDate()),
                        toText(it.getEndDate()),
                        it.getClientOrg()
                ))
                .toList();
    }

    private static String toText(LocalDate date) {
        return date == null ? null : date.toString();
    }

    // 크롤러(cwma-sync)의 normalizeCompanyName 과 동일: 법인격 표기 제거 후 공백 정규화
    private static String normalize(String name) {
        val stripped = name
                .replaceAll("\\(주\\)|\\(유\\)|\\(합\\)|\\(사\\)", "")
                .replace("주식회사", "")
                .replace("유한회사", "")
                .replace("합자회사", "")
                .replace("합명회사", "")
                .trim();
        return stripped.replaceAll("\\s+", " ");
    }
}
