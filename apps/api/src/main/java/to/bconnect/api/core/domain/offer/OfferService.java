package to.bconnect.api.core.domain.offer;

import lombok.extern.slf4j.Slf4j;
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
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.storage.task.TaskType;

@Slf4j
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

        val created = new OfferEntity(command.taskId(), command.workerId(), command.due());
        return offerRepository.save(created).getId();
    }

    @Transactional(readOnly = true)
    public Offer get(AuthUser user, Long offerId) {
        val found = offerRepository.findById(offerId)
                .orElseThrow(() -> new CodeException(OfferExceptionCode.NOT_FOUND));

        if (!found.getWorkerId().equals(user.id())) {
            val task = taskRepository.findById(found.getTaskId())
                    .orElseThrow(() -> new CodeException(TaskExceptionCode.NOT_FOUND));
            val project = projectRepository.findById(task.getProjectId())
                    .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
            val company = companyRepository.findByMemberId(user.id())
                    .orElseThrow(() -> new CodeException(CommonExceptionCode.FORBIDDEN));
            if (!project.getCompanyId().equals(company.getId()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);
        }

        return Offer.of(found);
    }

    @Transactional
    public void accept(AuthUser user, Long offerId) {
        val found = offerRepository.findById(offerId)
                .orElseThrow(() -> new CodeException(OfferExceptionCode.NOT_FOUND));

        if (!found.getWorkerId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        val task = taskRepository.findById(found.getTaskId())
                .orElseThrow(() -> new CodeException(TaskExceptionCode.NOT_FOUND));
        task.assign(found.getWorkerId());

        offerRepository.deleteAll(offerRepository.findAllByTaskId(found.getTaskId()));
    }

    @Transactional
    public void deny(AuthUser user, Long offerId) {
        offerRepository.findById(offerId).ifPresent(it -> {
            if (!it.getWorkerId().equals(user.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);

            offerRepository.delete(it);
        });
    }
}
