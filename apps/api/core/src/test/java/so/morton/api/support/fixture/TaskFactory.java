package so.morton.api.support.fixture;

import so.morton.api.api.controller.v1.request.CreateTaskRequest;
import so.morton.api.api.controller.v1.request.UpdateTaskRequest;
import so.morton.api.domain.task.Task;
import so.morton.api.storage.domain.task.TaskEntity;
import so.morton.api.storage.value.Trade;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

public class TaskFactory {

    public static Task create(Long id, Long profileId) {
        return new Task(id, profileId, "company", ProfileFactory.ADDRESS, "task", "event",
                Set.of(Trade.ELECTRICAL), LocalDate.MIN, LocalDate.MIN,
                LocalDateTime.now(), LocalDateTime.now());
    }

    public static TaskEntity createEntity(Long profileId) {
        return TaskEntity.builder()
                .profileId(profileId)
                .company("company")
                .address(ProfileFactory.ADDRESS)
                .taskTitle("task")
                .eventTitle("event")
                .trades(Set.of(Trade.ELECTRICAL))
                .start(LocalDate.MIN)
                .end(LocalDate.MAX)
                .build();
    }

    public static CreateTaskRequest createRequest() {
        return new CreateTaskRequest(
                "company", ProfileFactory.ADDRESS, "create", "create",
                Set.of(Trade.ELECTRICAL), LocalDate.MIN, LocalDate.MAX);
    }

    public static UpdateTaskRequest updateRequest() {
        return new UpdateTaskRequest(
                "company", ProfileFactory.ADDRESS, "update", "update",
                Set.of(Trade.DEMOLITION), LocalDate.MIN, LocalDate.MAX);
    }
}
