package to.bconnect.api.core.domain.offer;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.task.TaskExceptionCode;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.offer.OfferEntity;
import to.bconnect.api.storage.offer.OfferRepository;
import to.bconnect.api.storage.offer.OfferStatus;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.task.TaskEntity;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.storage.task.TaskType;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OfferService {

    private final OfferRepository offerRepository;
    private final CompanyRepository companyRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public Long create(AuthUser user, CreateOffer command) {
        val company = companyRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        val task = taskRepository.findById(command.taskId())
                .orElseThrow(() -> new CodeException(TaskExceptionCode.NOT_FOUND));
        if (task.getType() != TaskType.PROJECT)
            throw new CodeException(OfferExceptionCode.NOT_PROJECT_TASK);

        val project = projectRepository.findById(task.getProjectId())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        if (!project.getCompanyId().equals(company.getId()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        if (!memberRepository.existsById(command.workerId()))
            throw new CodeException(OfferExceptionCode.WORKER_NOT_FOUND);

        val seq = offerRepository.findFirstByTaskIdOrderBySeqDesc(command.taskId())
                .map(OfferEntity::getSeq).orElse(0) + 1;
        val created = new OfferEntity(command.taskId(), command.workerId(), seq, command.due());
        val id = offerRepository.save(created).getId();

        promoteNext(command.taskId(), 0);
        return id;
    }

    @Transactional
    public void accept(AuthUser user, Long offerId) {
        val found = offerRepository.findById(offerId)
                .orElseThrow(() -> new CodeException(OfferExceptionCode.NOT_FOUND));

        if (!found.getWorkerId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        if (found.getStatus() != OfferStatus.OFFERED)
            throw new CodeException(OfferExceptionCode.INVALID_STATUS);

        found.accept();

        val task = taskRepository.findById(found.getTaskId())
                .orElseThrow(() -> new CodeException(TaskExceptionCode.NOT_FOUND));
        task.assign(found.getWorkerId());

        // cancel other offers
        offerRepository.findAllByTaskIdAndStatus(found.getTaskId(), OfferStatus.PENDING)
                .forEach(OfferEntity::cancel);
    }

    @Transactional
    public void deny(AuthUser user, Long offerId) {
        val found = offerRepository.findById(offerId)
                .orElseThrow(() -> new CodeException(OfferExceptionCode.NOT_FOUND));

        if (!found.getWorkerId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        if (found.getStatus() != OfferStatus.OFFERED)
            throw new CodeException(OfferExceptionCode.INVALID_STATUS);

        found.deny();
        promoteNext(found.getTaskId(), found.getSeq());
    }

    @Transactional
    public void cancel(AuthUser user, Long offerId) {
        val found = offerRepository.findById(offerId)
                .orElseThrow(() -> new CodeException(OfferExceptionCode.NOT_FOUND));

        val task = taskRepository.findById(found.getTaskId())
                .orElseThrow(() -> new CodeException(TaskExceptionCode.NOT_FOUND));
        authenticate(user, task);

        if (found.getStatus() != OfferStatus.PENDING && found.getStatus() != OfferStatus.OFFERED)
            throw new CodeException(OfferExceptionCode.INVALID_STATUS);

        found.cancel();
        promoteNext(found.getTaskId(), found.getSeq());
    }

    @Transactional
    public void reorder(AuthUser user, ReorderOffers command) {
        // check duplicated
        val offerIds = command.offerIds();
        if (offerIds.size() != Set.copyOf(offerIds).size())
            throw new CodeException(OfferExceptionCode.INVALID_REORDER);

        // check exists
        val offers = offerRepository.findAllById(offerIds);
        if (offers.size() != offerIds.size())
            throw new CodeException(OfferExceptionCode.INVALID_REORDER);

        // check pending
        val taskId = offers.getFirst().getTaskId();
        val valid = offers.stream()
                .allMatch(it -> it.getTaskId().equals(taskId) && it.getStatus() == OfferStatus.PENDING);
        if (!valid)
            throw new CodeException(OfferExceptionCode.INVALID_REORDER);

        val task = taskRepository.findById(taskId)
                .orElseThrow(() -> new CodeException(TaskExceptionCode.NOT_FOUND));
        authenticate(user, task);

        val pendingCount = offerRepository.findAllByTaskIdAndStatus(taskId, OfferStatus.PENDING).size();
        if (pendingCount != offerIds.size())
            throw new CodeException(OfferExceptionCode.INVALID_REORDER);

        val base = offerRepository.findAllByTaskIdAndStatus(taskId, OfferStatus.OFFERED).stream()
                .mapToInt(OfferEntity::getSeq)
                .max()
                .orElse(0);
        val offerById = offers.stream().collect(Collectors.toMap(OfferEntity::getId, it -> it));
        int seq = base + 1;
        for (val offerId : offerIds) {
            offerById.get(offerId).reorder(seq++);
        }
    }

    @Transactional(readOnly = true)
    public List<Offer> listByTask(AuthUser user, Long taskId) {
        val task = taskRepository.findById(taskId)
                .orElseThrow(() -> new CodeException(TaskExceptionCode.NOT_FOUND));
        authenticate(user, task);

        return offerRepository.findAllByTaskIdOrderBySeqAsc(taskId).stream()
                .map(Offer::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Offer> listByWorker(AuthUser user) {
        return offerRepository.findAllByWorkerIdAndStatus(user.id(), OfferStatus.OFFERED).stream()
                .map(Offer::of)
                .toList();
    }

    private void promoteNext(Long taskId, int curr) {
        if (offerRepository.existsByTaskIdAndStatus(taskId, OfferStatus.OFFERED))
            return;

        offerRepository.findFirstByTaskIdAndStatusAndSeqGreaterThanOrderBySeqAsc(taskId, OfferStatus.PENDING, curr)
                .ifPresent(it -> {
                    it.offered();
                    // TODO: 메시지 발송
                });
    }

    private void authenticate(AuthUser user, TaskEntity task) {
        val company = companyRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.FORBIDDEN));

        val project = projectRepository.findById(task.getProjectId())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        if (!project.getCompanyId().equals(company.getId()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
    }
}
