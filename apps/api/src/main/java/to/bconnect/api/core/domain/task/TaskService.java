package to.bconnect.api.core.domain.task;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.core.domain.project.ProjectFinder;
import to.bconnect.api.storage.offer.OfferRepository;
import to.bconnect.api.storage.post.PostEntity;
import to.bconnect.api.storage.post.PostRepository;
import to.bconnect.api.storage.task.TaskEntity;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.storage.task.TaskType;
import to.bconnect.api.security.AuthUser;

import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;


@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectFinder projectFinder;
    private final OfferRepository offerRepository;
    private final PostRepository postRepository;

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

        found.update(command.trades(), command.start(), command.end(),
                command.title(), command.memo(), command.company(), command.address());
    }

    @Transactional
    public void updateByCompany(AuthUser user, Long taskId, UpdateProjectTask command) {
        val task = taskRepository.findById(taskId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (task.getType() != TaskType.PROJECT)
            throw new CodeException(TaskExceptionCode.INVALID_TYPE);

        projectFinder.validateOwnership(user.id(), task.getProjectId());

        task.update(command.trades(), command.start(), command.end(),
                command.title(), command.requirement(), command.memo());
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

        found.update(command.title(), command.memo());
    }

    @Transactional
    public void delete(AuthUser user, Long taskId) {
        val optional = taskRepository.findById(taskId);
        if (optional.isEmpty())
            return;
        val task = optional.get();

        if (task.getType() == TaskType.WORKER) {
            if (!user.id().equals(task.getWorkerId()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);
        } else {
            projectFinder.validateOwnership(user.id(), task.getProjectId());
        }

        offerRepository.deleteByTaskId(task.getId());

        postRepository.findAllByTaskId(task.getId())
                .forEach(PostEntity::detachTask);

        taskRepository.delete(task);
    }
}
