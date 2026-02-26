package so.morton.api.domain.task;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.api.controller.v1.request.CreateTaskRequest;
import so.morton.api.api.controller.v1.request.UpdateTaskRequest;
import so.morton.api.storage.domain.task.TaskEntity;
import so.morton.api.storage.domain.task.TaskRepository;
import so.morton.api.storage.value.EntityStatus;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskFinder taskFinder;

    @Transactional
    public Task create(Long foremanId, CreateTaskRequest request) {
        TaskEntity entity = TaskEntity.builder()
                .foremanId(foremanId)
                .company(request.company())
                .address(request.address())
                .taskTitle(request.taskTitle())
                .eventTitle(request.eventTitle())
                .trades(request.trades())
                .start(request.start())
                .end(request.end())
                .build();

        TaskEntity saved = taskRepository.save(entity);
        return Task.of(saved);
    }

    @Transactional(readOnly = true)
    public Task get(Long taskId) {
        return taskFinder.find(taskId);
    }

    @Transactional(readOnly = true)
    public List<Task> getAll() {
        return taskFinder.findAllActive();
    }

    @Transactional
    public Task update(Long taskId, Long userId, UpdateTaskRequest request) {
        TaskEntity entity = taskRepository.findById(taskId)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!entity.getForemanId().equals(userId)) {
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        }

        entity.update(
                request.company(),
                request.address(),
                request.taskTitle(),
                request.eventTitle(),
                request.trades(),
                request.start(),
                request.end()
        );

        return Task.of(entity);
    }

    @Transactional
    public void delete(Long taskId, Long userId) {
        TaskEntity entity = taskRepository.findById(taskId)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!entity.getProfileId().equals(profileId)) {
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        }

        entity.delete();
    }
}
