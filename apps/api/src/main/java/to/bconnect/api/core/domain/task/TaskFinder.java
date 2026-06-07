package to.bconnect.api.core.domain.task;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import to.bconnect.api.core.storage.task.TaskRepository;

import java.util.List;

@Component
@RequiredArgsConstructor
public class TaskFinder {

    private final TaskRepository taskRepository;

    public List<Task> findAllByProfileId(Long profileId) {
        return taskRepository.findAllByProfileId((profileId))
                .stream()
                .map(Task::of)
                .toList();
    }
}
