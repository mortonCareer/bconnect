package to.bconnect.api.support.fixture;

import to.bconnect.api.api.controller.v1.request.CreateTaskRequest;
import to.bconnect.api.api.controller.v1.request.UpdateTaskRequest;
import to.bconnect.api.domain.task.Task;
import to.bconnect.api.storage.domain.task.TaskEntity;
import to.bconnect.api.storage.common.value.Trade;

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
