package to.bconnect.api.oneclick.infrastructure.kiscon;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.oneclick.OneClickUtils;
import to.bconnect.api.oneclick.domain.kiscon.Disposition;
import to.bconnect.api.oneclick.domain.kiscon.License;
import to.bconnect.api.oneclick.storage.KisconAdminPenaltyEntity;
import to.bconnect.api.oneclick.storage.KisconAdminPenaltyRepository;
import to.bconnect.api.oneclick.storage.KisconRegistrationEntity;
import to.bconnect.api.oneclick.storage.KisconRegistrationRepository;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

// 건설업 면허 조회 (키스콘)
@Component
@RequiredArgsConstructor
public class KisconLicenseFinder {

    private static final String WITHDRAWN = "철회";

    private final KisconRegistrationRepository kisconRegistrationRepository;
    private final KisconAdminPenaltyRepository kisconAdminPenaltyRepository;

    @Transactional(readOnly = true)
    public List<License> listLicenses(String brn, String companyName, String ownerName) {
        return OneClickUtils.lookup(
                        brn, kisconRegistrationRepository::findAllByNcrMasterNum,
                        companyName, kisconRegistrationRepository::findAllByNormalizedCompanyName,
                        KisconRegistrationEntity::getNcrGsMaster, ownerName)
                .stream()
                .filter(it -> it.getNcrItemName() != null)
                .collect(Collectors.groupingBy(
                        KisconRegistrationEntity::getNcrItemName,
                        Collectors.maxBy(Comparator.comparing(KisconRegistrationEntity::getNcrGsSeq))))
                .values()
                .stream()
                .flatMap(Optional::stream)
                .filter(it -> !WITHDRAWN.equals(it.getNcrGsFlag()))
                .map(it -> new License(
                        it.getNcrGsSeq(),
                        it.getNcrMasterNum(),
                        it.getNcrGsKname(),
                        it.getNcrGsMaster(),
                        it.getNcrItemName(),
                        it.getNcrItemregno(),
                        it.getNcrGsAddr(),
                        it.getNcrAreaName(),
                        it.getNcrAreaDetailName(),
                        OneClickUtils.parseDate(it.getNcrGsDate()),
                        OneClickUtils.parseDate(it.getNcrGsRegdate()),
                        it.getNcrGsFlag(),
                        it.getNcrOffTel(),
                        it.getNcrGsNumber(),
                        it.getNcrGsReason()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Disposition> listDispositions(String brn, String companyName, String ownerName) {
        return OneClickUtils.lookup(
                        brn, kisconAdminPenaltyRepository::findAllByNcrMasterNum,
                        companyName, kisconAdminPenaltyRepository::findAllByNormalizedCompanyName,
                        KisconAdminPenaltyEntity::getNcrAdmiMaster, ownerName)
                .stream()
                .filter(it -> !WITHDRAWN.equals(it.getNcrGsFlag()))
                .map(it -> new Disposition(
                        it.getNcrGsSeq(),
                        it.getNcrMasterNum(),
                        it.getNcrAdmiKname(),
                        it.getNcrAdmiMaster(),
                        it.getNcrItemName(),
                        it.getNcrItemregno(),
                        it.getNcrAdmiAddr(),
                        it.getNcrAreaName(),
                        it.getNcrAreaDetailName(),
                        it.getNcrAdmiDename(),
                        it.getEcodeAdmiCon(),
                        it.getNcrAdmiReason(),
                        it.getEcodeAdmiGround(),
                        it.getNcrAdmiFine(),
                        it.getNcrAdmiPenalty(),
                        it.getNcrAdmiStopSdate(),
                        it.getNcrAdmiStopEdate(),
                        it.getNcrAdmiCanceldate(),
                        it.getNcrAdmiCorrect(),
                        OneClickUtils.parseDate(it.getNcrGsDate()),
                        OneClickUtils.parseDate(it.getNcrGsRegdate()),
                        it.getNcrGsFlag(),
                        it.getNcrOffTel(),
                        it.getNcrPdStatus(),
                        it.getNcrGsNumber(),
                        it.getNcrGsReason()))
                .toList();
    }
}
