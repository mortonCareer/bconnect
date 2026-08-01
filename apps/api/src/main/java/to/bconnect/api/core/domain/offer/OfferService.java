package to.bconnect.api.core.domain.offer;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.ApiConfigProps;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.company.CompanyFinder;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.offer.OfferEntity;
import to.bconnect.api.storage.offer.OfferRepository;
import to.bconnect.api.storage.offer.OfferStatus;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.storage.task.TaskType;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OfferService {

    private static final int DUE_EXTENSION_DAYS = 3;

    private final OfferRepository offerRepository;
    private final CompanyRepository companyRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final MemberRepository memberRepository;
    private final CompanyFinder companyFinder;
    private final ApplicationEventPublisher eventPublisher;
    private final ApiConfigProps apiConfigProps;

    @Transactional
    public Long create(AuthUser user, CreateOffer command) {
        val company = companyRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        val task = taskRepository.findById(command.taskId())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        if (task.getType() != TaskType.PROJECT)
            throw new CodeException(OfferExceptionCode.NOT_PROJECT_TASK);

        val project = projectRepository.findById(task.getProjectId())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        if (!project.getCompanyId().equals(company.getId()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        if (!memberRepository.existsById(command.workerId()))
            throw new CodeException(CommonExceptionCode.NOT_FOUND);

        val nextSeq = offerRepository.findFirstByTaskIdOrderBySeqDesc(command.taskId())
                .map(OfferEntity::getSeq).orElse(0) + 1;
        val created = offerRepository.save(
                new OfferEntity(command.taskId(), command.workerId(), nextSeq));

        promoteNext(command.taskId(), 0);
        return created.getId();
    }

    @Transactional
    public void accept(AuthUser user, Long offerId) {
        val found = offerRepository.findById(offerId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getWorkerId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        if (found.getStatus() != OfferStatus.ACTIVE)
            throw new CodeException(OfferExceptionCode.INVALID_STATUS);

        found.accept();

        val task = taskRepository.findById(found.getTaskId())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        task.assign(found.getWorkerId());

        // cancel other offers
        offerRepository.findAllByTaskIdAndStatus(found.getTaskId(), OfferStatus.PENDING)
                .forEach(OfferEntity::cancel);

        val company = companyFinder.getByTaskId(found.getTaskId());
        eventPublisher.publishEvent(new OfferEvent(
                found.getId(), found.getWorkerId(), company.id(), company.memberId(), OfferStatus.ACCEPTED));
    }

    @Transactional
    public void deny(AuthUser user, Long offerId) {
        val found = offerRepository.findById(offerId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getWorkerId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        if (found.getStatus() != OfferStatus.ACTIVE)
            throw new CodeException(OfferExceptionCode.INVALID_STATUS);

        found.deny();

        val company = companyFinder.getByTaskId(found.getTaskId());
        eventPublisher.publishEvent(new OfferEvent(
                found.getId(), found.getWorkerId(), company.id(), company.memberId(), OfferStatus.DENIED));

        promoteNext(found.getTaskId(), found.getSeq());
    }

    @Transactional
    public void cancel(AuthUser user, Long offerId) {
        val found = offerRepository.findById(offerId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        val ownerId = companyFinder.getByTaskId(found.getTaskId()).memberId();
        if (!user.id().equals(ownerId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        if (found.getStatus() != OfferStatus.PENDING && found.getStatus() != OfferStatus.ACTIVE)
            throw new CodeException(OfferExceptionCode.INVALID_STATUS);

        found.cancel();
        promoteNext(found.getTaskId(), found.getSeq());
    }

    @Transactional
    public void reorder(AuthUser user, List<Long> offerIds) {
        // check exists
        val offers = offerRepository.findAllById(offerIds);
        if (offers.size() != offerIds.size())
            throw new CodeException(OfferExceptionCode.INVALID_REORDER);

        // check same task & pending
        val taskId = offers.getFirst().getTaskId();
        offers.forEach(it -> {
            if (!it.getTaskId().equals(taskId) || !(it.getStatus() == OfferStatus.PENDING))
                throw new CodeException(OfferExceptionCode.INVALID_REORDER);
        });

        // check omitted
        val count = offerRepository.countByTaskIdAndStatus(taskId, OfferStatus.PENDING);
        if (count != offerIds.size())
            throw new CodeException(OfferExceptionCode.INVALID_REORDER);

        // check ownership
        val ownerId = companyFinder.getByTaskId(taskId).memberId();
        if (!user.id().equals(ownerId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        // reorder
        val base = offerRepository.findFirstByTaskIdAndStatusOrderBySeqDesc(taskId, OfferStatus.ACTIVE)
                .map(OfferEntity::getSeq)
                .orElse(0);
        val offerMap = offers.stream().collect(Collectors.toMap(OfferEntity::getId, it -> it));
        int seq = base + 1;
        for (val offerId : offerIds)
            offerMap.get(offerId).reorder(seq++);
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
        return offerRepository.findAllByWorkerIdAndStatus(user.id(), OfferStatus.ACTIVE).stream()
                .map(Offer::of)
                .toList();
    }

    @Transactional
    public void expire(Long offerId) {
        val found = offerRepository.findById(offerId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        if (found.getStatus() != OfferStatus.ACTIVE)
            return;

        found.expire();

        val company = companyFinder.getByTaskId(found.getTaskId());
        eventPublisher.publishEvent(new OfferEvent(
                found.getId(), found.getWorkerId(), company.id(), company.memberId(), OfferStatus.EXPIRED));

        promoteNext(found.getTaskId(), found.getSeq());
    }

    private void promoteNext(Long taskId, int currSeq) {
        if (offerRepository.existsByTaskIdAndStatus(taskId, OfferStatus.ACTIVE))
            return;

        val optional = offerRepository.findFirstByTaskIdAndStatusAndSeqGreaterThanOrderBySeqAsc(taskId, OfferStatus.PENDING, currSeq);
        if (optional.isEmpty())
            return;

        val found = optional.get();
        found.offered();
        found.updateDue(LocalDate.now(apiConfigProps.zoneId()).plusDays(DUE_EXTENSION_DAYS));
        val company = companyFinder.getByTaskId(taskId);
        eventPublisher.publishEvent(new OfferEvent(
                found.getId(), found.getWorkerId(), company.id(), company.memberId(), OfferStatus.ACTIVE));
    }

}
