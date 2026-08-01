package to.bconnect.api.core.domain.task;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.project.ProjectFinder;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.company.CompanyEntity;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.offer.OfferEntity;
import to.bconnect.api.storage.offer.OfferRepository;
import to.bconnect.api.storage.offer.OfferStatus;
import to.bconnect.api.storage.post.PostEntity;
import to.bconnect.api.storage.post.PostRepository;
import to.bconnect.api.storage.project.ProjectEntity;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.task.TaskEntity;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.storage.task.TaskStatus;
import to.bconnect.api.storage.task.TaskType;


@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectFinder projectFinder;
    private final OfferRepository offerRepository;
    private final PostRepository postRepository;
    private final ProjectRepository projectRepository;
    private final CompanyRepository companyRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public Long createByWorker(AuthUser user, CreateWorkerTask command) {
        val created = new TaskEntity(
                TaskType.WORKER,
                command.trades(),
                command.start(),
                command.end(),
                user.id(),
                command.title(),
                command.memo(),
                command.company(),
                command.address(),
                null,
                null,
                null,
                null
        );

        return taskRepository.save(created).getId();
    }

    @Transactional
    public Long createByCompany(AuthUser user, CreateProjectTask command) {
        projectFinder.validateOwnership(user.id(), command.projectId());

        val created = new TaskEntity(
                TaskType.PROJECT,
                command.trades(),
                command.start(),
                command.end(),
                null,
                null,
                null,
                null,
                null,
                command.projectId(),
                command.title(),
                command.requirement(),
                command.memo()
        );

        return taskRepository.save(created).getId();
    }

    @Transactional
    public void updateByWorker(AuthUser user, Long taskId, UpdateWorkerTask command) {
        val found = taskRepository.findById(taskId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (found.getType() != TaskType.WORKER)
            throw new CodeException(TaskExceptionCode.INVALID_TYPE);

        if (!user.id().equals(found.getWorkerId()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.update(command.trades(), command.start(), command.end(), command.progress(),
                command.title(), command.memo(), command.company(), command.address());
    }

    @Transactional
    public void updateByCompany(AuthUser user, Long taskId, UpdateProjectTask command) {
        val found = taskRepository.findById(taskId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (found.getType() != TaskType.PROJECT)
            throw new CodeException(TaskExceptionCode.INVALID_TYPE);

        projectFinder.validateOwnership(user.id(), found.getProjectId());

        found.update(command.trades(), command.start(), command.end(), command.progress(),
                command.title(), command.requirement(), command.memo());

        val workerId = switch (found.getStatus()) {
            case ASSIGNED -> found.getWorkerId();
            case OFFERED -> offerRepository.findAllByTaskIdAndStatus(taskId, OfferStatus.ACTIVE).stream()
                    .map(OfferEntity::getWorkerId)
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException(
                            "섭외 중인 작업에 진행 중인 섭외가 없습니다: taskId=%d".formatted(taskId)));
            default -> null;
        };

        if (workerId != null)
            eventPublisher.publishEvent(new TaskEvent(taskId, workerId, user.id()));
    }

    @Transactional
    public void updateByAssignee(AuthUser user, Long taskId, UpdateAssigneeTask command) {
        val found = taskRepository.findById(taskId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (found.getType() != TaskType.PROJECT)
            throw new CodeException(TaskExceptionCode.INVALID_TYPE);

        if (found.getWorkerId() == null)
            throw new CodeException(TaskExceptionCode.NOT_ASSIGNED);

        if (!user.id().equals(found.getWorkerId()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.update(command.progress(), command.title(), command.memo());

        val ownerId = projectRepository.findById(found.getProjectId())
                .map(ProjectEntity::getCompanyId)
                .flatMap(companyRepository::findById)
                .map(CompanyEntity::getMemberId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        eventPublisher.publishEvent(new TaskEvent(taskId, user.id(), ownerId));
    }

    @Transactional
    public void unassign(AuthUser user, Long taskId) {
        val found = taskRepository.findById(taskId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (found.getType() != TaskType.PROJECT)
            throw new CodeException(TaskExceptionCode.INVALID_TYPE);

        if (found.getStatus() != TaskStatus.ASSIGNED)
            throw new CodeException(TaskExceptionCode.NOT_ASSIGNED);

        if (!user.id().equals(found.getWorkerId()) && !projectFinder.isOwner(user.id(), found.getProjectId()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.unassign();
        offerRepository.findAllByTaskIdAndStatus(taskId, OfferStatus.ACCEPTED)
                .forEach(OfferEntity::cancel);
    }

    @Transactional
    public void delete(AuthUser user, Long taskId) {
        val optional = taskRepository.findById(taskId);
        if (optional.isEmpty())
            return;

        val found = optional.get();
        if (found.getType() == TaskType.WORKER) {
            if (!user.id().equals(found.getWorkerId()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);
        } else {
            projectFinder.validateOwnership(user.id(), found.getProjectId());
        }

        offerRepository.deleteAllByTaskId(found.getId());
        postRepository.findAllByTaskId(found.getId())
                .forEach(PostEntity::detachTask);
        taskRepository.delete(found);
    }
}
