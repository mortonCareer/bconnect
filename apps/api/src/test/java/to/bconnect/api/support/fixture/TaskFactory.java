package to.bconnect.api.support.fixture;

import to.bconnect.api.core.presentation.v1.request.CreateWorkerTaskRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateWorkerTaskRequest;
import to.bconnect.api.core.domain.task.Task;
import to.bconnect.api.storage.task.TaskEntity;
import to.bconnect.api.storage.task.TaskStatus;
import to.bconnect.api.storage.task.TaskType;
import to.bconnect.api.storage.profile.Trade;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

public class TaskFactory {

    private static final LocalDate START_DATE = LocalDate.of(2026, 6, 1);
    private static final LocalDate END_DATE = LocalDate.of(2026, 6, 30);

    public static Task create(Long id, Long memberId) {
        return new Task(id, TaskType.WORKER, Set.of(Trade.ELECTRICAL), START_DATE, END_DATE, TaskStatus.DRAFT,
                memberId, "task", "memo", "company", ProfileFactory.DEFAULT_ADDRESS,
                null, null, null, null,
                LocalDateTime.now(), LocalDateTime.now());
    }

    public static TaskEntity createEntity(Long memberId) {
        return new TaskEntity(
                TaskType.WORKER,
                Set.of(Trade.ELECTRICAL),
                START_DATE,
                END_DATE,
                memberId,
                "task",
                "memo",
                "company",
                ProfileFactory.DEFAULT_ADDRESS,
                null,
                null,
                null,
                null
        );
    }

    public static CreateWorkerTaskRequest createRequest() {
        return new CreateWorkerTaskRequest(
                Set.of(Trade.ELECTRICAL), START_DATE, END_DATE,
                "create", "create", "company", ProfileFactory.DEFAULT_ADDRESS);
    }

    public static UpdateWorkerTaskRequest updateRequest() {
        return new UpdateWorkerTaskRequest(
                Set.of(Trade.DEMOLITION), START_DATE, END_DATE,
                "update", "update", "company", ProfileFactory.DEFAULT_ADDRESS);
    }
}
