package to.bconnect.api.core.domain.task;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.core.domain.coworker.CoworkerService;
import to.bconnect.api.storage.task.TaskEntity;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.security.AuthUser;

import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;

import java.util.List;
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final CoworkerService coworkerService;

    @Transactional(readOnly = true)
    public List<Task> list(AuthUser user) {
        return taskRepository.findAllByMemberId(user.id())
                .stream()
                .map(Task::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Task> listByCoworker(AuthUser user, Long targetId) {
        if (!coworkerService.isCoworker(user.id(), targetId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        return taskRepository.findAllByMemberId(user.id())
                .stream()
                .map(Task::of)
                .toList();
    }

    @Transactional
    public Long create(AuthUser user, CreateTask command) {
        TaskEntity created = new TaskEntity(
                user.id(),
                command.company(),
                command.address(),
                command.taskTitle(),
                command.eventTitle(),
                command.trades(),
                command.start(),
                command.end()
        );

        return taskRepository.save(created).getId();
    }

    @Transactional
    public void update(AuthUser user, Long taskId, UpdateTask command) {
        TaskEntity found = taskRepository.findById(taskId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.update(
                command.company(),
                command.address(),
                command.taskTitle(),
                command.eventTitle(),
                command.trades(),
                command.start(),
                command.end()
        );
    }

    @Transactional
    public void delete(AuthUser user, Long taskId) {
        taskRepository.findById(taskId).ifPresent(it -> {
            if (!it.getMemberId().equals(user.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);
            taskRepository.delete(it);
        });
    }
}
