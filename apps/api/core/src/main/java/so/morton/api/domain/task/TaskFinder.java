package so.morton.api.domain.task;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import so.morton.api.storage.domain.task.TaskRepository;

import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

import java.util.List;

@Component
@RequiredArgsConstructor
public class TaskFinder {

    private final TaskRepository taskRepository;

    public Task find(Long taskId) {
        return taskRepository.findById(taskId)
                .map(Task::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    public List<Task> findAll() {
        return taskRepository.findAll()
                .stream()
                .map(Task::of)
                .toList();
    }
}
