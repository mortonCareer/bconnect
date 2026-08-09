package to.bconnect.api.core.domain.offer;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.company.CompanyFinder;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.offer.OfferRepository;
import to.bconnect.api.storage.offer.OfferStatus;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OfferQueryService {

    private final OfferRepository offerRepository;
    private final CompanyFinder companyFinder;

    @Transactional(readOnly = true)
    public Offer get(AuthUser user, Long id) {
        val found = offerRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        val ownerId = companyFinder.getByTaskId(found.getTaskId()).memberId();
        if (!user.id().equals(found.getWorkerId()) && !user.id().equals(ownerId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        return Offer.of(found);
    }

    @Transactional(readOnly = true)
    public List<Offer> listByTask(AuthUser user, Long taskId) {
        val ownerId = companyFinder.getByTaskId(taskId).memberId();
        if (!user.id().equals(ownerId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        return offerRepository.findAllByTaskIdAndStatusInOrderBySeqAsc(taskId, List.of(OfferStatus.ACTIVE, OfferStatus.PENDING)).stream()
                .map(Offer::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Offer> listByWorker(AuthUser user) {
        return offerRepository.findAllByWorkerIdAndStatusOrderByIdDesc(user.id(), OfferStatus.ACTIVE).stream()
                .map(Offer::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<Long, Offer> activeMap(Collection<Long> taskIds) {
        return offerRepository.findAllByTaskIdInAndStatus(taskIds, OfferStatus.ACTIVE).stream()
                .map(Offer::of)
                .collect(Collectors.toMap(Offer::taskId, Function.identity()));
    }
}
