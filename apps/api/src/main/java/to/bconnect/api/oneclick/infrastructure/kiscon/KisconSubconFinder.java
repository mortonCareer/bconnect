package to.bconnect.api.oneclick.infrastructure.kiscon;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.oneclick.OneClickUtils;
import to.bconnect.api.oneclick.domain.kiscon.SubcontractRestriction;
import to.bconnect.api.oneclick.storage.KisconSubconLimitRepository;

import java.util.List;

// 하도급 참여제한 조회 (키스콘)
@Component
@RequiredArgsConstructor
public class KisconSubconFinder {

    private final KisconSubconLimitRepository kisconSubconLimitRepository;

    @Transactional(readOnly = true)
    public List<SubcontractRestriction> list(String brn) {
        return kisconSubconLimitRepository.findAllByBizRegNo(brn)
                .stream()
                .map(it -> new SubcontractRestriction(
                        it.getSeqNo(),
                        it.getViolationType(),
                        it.getCompanyName(),
                        it.getCorpNo(),
                        it.getBizRegNo(),
                        it.getRepresentative(),
                        OneClickUtils.parseDottedDate(it.getRestrictionStart()),
                        OneClickUtils.parseDottedDate(it.getRestrictionEnd()),
                        it.getCategory(),
                        it.getAnnouncementDate(),
                        it.getCertificateUrl(),
                        it.getNote()
                ))
                .toList();
    }
}
