package so.morton.api.support.fixture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import so.morton.api.storage.domain.task.TaskEntity;
import so.morton.api.storage.domain.task.TaskRepository;
import so.morton.api.storage.value.Trade;

import java.time.LocalDate;
import java.util.Set;

@Component
public class TaskFactory {

    @Autowired private TaskRepository taskRepository;

    public TaskEntity create(Long profileId) {
        return taskRepository.save(TaskEntity.builder()
                .profileId(profileId)
                .company("company")
                .address(Fixtures.ADDRESS)
                .taskTitle("task")
                .eventTitle("event")
                .trades(Set.of(Trade.ELECTRICAL))
                .start(LocalDate.now())
                .end(LocalDate.now().plusDays(7))
                .build());
    }
}
