package to.bconnect.api.domain.task;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import to.bconnect.api.storage.domain.task.TaskRepository;

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
}
