package to.bconnect.api.core.domain.task;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.project.ProjectFinder;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.storage.task.TaskEntity;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.storage.task.TaskType;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TaskQueryService {

    private final TaskRepository taskRepository;
    private final CoworkerRepository coworkerRepository;
    private final ProjectFinder projectFinder;

    @Transactional(readOnly = true)
    public Optional<Task> get(Long taskId) {
        return taskRepository.findById(taskId).map(Task::of);
    }

    @Transactional(readOnly = true)
    public List<Task> listByIds(Collection<Long> taskIds) {
        return taskRepository.findAllById(taskIds).stream()
                .map(Task::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Task> list(AuthUser user) {
        return taskRepository.findAllByWorkerIdAndType(user.id(), TaskType.WORKER)
                .stream()
                .map(Task::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Task> listAssigned(AuthUser user) {
        return taskRepository.findAllByWorkerIdAndType(user.id(), TaskType.PROJECT)
                .stream()
                .map(Task::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Task> listByCoworker(AuthUser user, Long targetId) {
        if (!coworkerRepository.existsByMembers(user.id(), targetId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        return taskRepository.findAllByWorkerId(targetId)
                .stream()
                .map(Task::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Task> listByProject(AuthUser user, Long projectId) {
        projectFinder.validateOwnership(user.id(), projectId);

        return taskRepository.findAllByProjectId(projectId)
                .stream()
                .map(Task::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Long> listAssigneeIdsByProject(AuthUser user, Long projectId) {
        projectFinder.validateOwnership(user.id(), projectId);

        return taskRepository.findAllByProjectIdAndWorkerIdNotNull(projectId)
                .stream()
                .map(TaskEntity::getWorkerId)
                .distinct()
                .toList();
    }
}
