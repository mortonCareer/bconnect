package to.bconnect.api.support.fixture;

import to.bconnect.api.core.presentation.v1.request.CreateTaskRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateTaskRequest;
import to.bconnect.api.core.domain.task.Task;
import to.bconnect.api.storage.task.TaskEntity;
import to.bconnect.api.storage.profile.Trade;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

public class TaskFactory {

    private static final LocalDate START_DATE = LocalDate.of(2026, 6, 1);
    private static final LocalDate END_DATE = LocalDate.of(2026, 6, 31);

    public static Task create(Long id, Long memberId) {
        return new Task(id, memberId, "company", ProfileFactory.DEFAULT_ADDRESS, "task", "event",
                Set.of(Trade.ELECTRICAL), START_DATE, END_DATE,
                LocalDateTime.now(), LocalDateTime.now());
    }

    public static TaskEntity createEntity(Long memberId) {
        return new TaskEntity(
                memberId,
                "company",
                ProfileFactory.DEFAULT_ADDRESS,
                "task",
                "event",
                Set.of(Trade.ELECTRICAL),
                START_DATE,
                END_DATE
        );
    }

    public static CreateTaskRequest createRequest() {
        return new CreateTaskRequest(
                "company", ProfileFactory.DEFAULT_ADDRESS, "create", "create",
                Set.of(Trade.ELECTRICAL), START_DATE, END_DATE);
    }

    public static UpdateTaskRequest updateRequest() {
        return new UpdateTaskRequest(
                "company", ProfileFactory.DEFAULT_ADDRESS, "update", "update",
                Set.of(Trade.DEMOLITION), START_DATE, END_DATE);
    }
}
