package to.bconnect.api.oneclick.infrastructure.kiscon;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.oneclick.domain.kiscon.Disposition;
import to.bconnect.api.oneclick.domain.kiscon.License;
import to.bconnect.api.oneclick.storage.KisconAdminPenaltyRepository;
import to.bconnect.api.oneclick.storage.KisconRegistrationEntity;
import to.bconnect.api.oneclick.storage.KisconRegistrationRepository;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

// 건설업 면허 조회 (키스콘)
@Component
@RequiredArgsConstructor
public class KisconLicenseFinder {

    private static final DateTimeFormatter REGISTERED_AT = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final String WITHDRAWN = "철회";

    private final KisconRegistrationRepository kisconRegistrationRepository;
    private final KisconAdminPenaltyRepository kisconAdminPenaltyRepository;

    @Transactional(readOnly = true)
    public List<License> listLicenses(String brn) {
        // 업종별 최신 공시(ncr_gs_seq 최대)만 채택 → 철회 상태면 제외 (공시 이력 중복·말소 면허 방지)
        return kisconRegistrationRepository.findAllByBizRegNo(brn)
                .stream()
                .filter(it -> it.getTradeName() != null)
                .collect(Collectors.groupingBy(
                        KisconRegistrationEntity::getTradeName,
                        Collectors.maxBy(Comparator.comparing(KisconRegistrationEntity::getNcrGsSeq))))
                .values()
                .stream()
                .flatMap(Optional::stream)
                .filter(it -> !WITHDRAWN.equals(it.getFlag()))
                .map(it -> new License(it.getTradeName(), parseDate(it.getRegDate())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Disposition> listDispositions(String brn) {
        return kisconAdminPenaltyRepository.findAllByBizRegNo(brn)
                .stream()
                .filter(it -> !WITHDRAWN.equals(it.getFlag()))
                .map(it -> new Disposition(it.getTradeName()))
                .toList();
    }

    private static LocalDate parseDate(Integer value) {
        if (value == null)
            return null;
        return LocalDate.parse(String.valueOf(value), REGISTERED_AT);
    }
}
