package to.bconnect.api.domain.task;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import to.bconnect.api.storage.domain.task.TaskRepository;

import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;

import java.util.List;

@Component
@RequiredArgsConstructor
public class TaskFinder {

    private final TaskRepository taskRepository;

    public List<Task> findByProfileId(Long profileId) {
        return taskRepository.findAllByProfileId((profileId))
                .stream()
                .map(Task::of)
                .toList();
    }

    public Task find(Long taskId) {
        return taskRepository.findById(taskId)
                .map(Task::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }
}
