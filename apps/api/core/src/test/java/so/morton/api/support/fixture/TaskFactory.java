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

    private static final LocalDate START_DATE = LocalDate.of(2024, 1, 1);
    private static final LocalDate END_DATE = LocalDate.of(2024, 12, 31);

    public static Task create(Long id, Long profileId) {
        return new Task(id, profileId, "company", ProfileFactory.ADDRESS, "task", "event",
                Set.of(Trade.ELECTRICAL), START_DATE, END_DATE,
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
                .start(START_DATE)
                .end(END_DATE)
                .build();
    }

    public static CreateTaskRequest createRequest() {
        return new CreateTaskRequest(
                "company", ProfileFactory.ADDRESS, "create", "create",
                Set.of(Trade.ELECTRICAL), START_DATE, END_DATE);
    }

    public static UpdateTaskRequest updateRequest() {
        return new UpdateTaskRequest(
                "company", ProfileFactory.ADDRESS, "update", "update",
                Set.of(Trade.DEMOLITION), START_DATE, END_DATE);
    }
}
