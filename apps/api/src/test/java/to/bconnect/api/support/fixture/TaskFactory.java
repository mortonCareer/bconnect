package to.bconnect.api.support.fixture;

import lombok.val;
import org.springframework.test.util.ReflectionTestUtils;
import to.bconnect.api.core.domain.task.*;
import to.bconnect.api.storage.profile.Trade;
import to.bconnect.api.storage.task.TaskEntity;
import to.bconnect.api.storage.task.TaskProgress;
import to.bconnect.api.storage.task.TaskStatus;
import to.bconnect.api.storage.task.TaskType;

import java.time.LocalDate;
import java.util.Set;

import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class TaskFactory {

    private static final LocalDate START_DATE = LocalDate.of(2026, 6, 1);
    private static final LocalDate END_DATE = LocalDate.of(2026, 6, 30);

    public static Task domain(Long id, Long memberId) {
        return new Task(id, TaskType.WORKER, Set.of(Trade.ELECTRICAL), START_DATE, END_DATE,
                TaskStatus.NONE, TaskProgress.TODO,
                memberId, "task", "memo", "company", ProfileFactory.DEFAULT_ADDRESS,
                null, null, null, null,
                MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static TaskEntity entity(Long memberId) {
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

    public static TaskEntity projectEntity(Long projectId, Long workerId) {
        return new TaskEntity(
                TaskType.PROJECT,
                Set.of(Trade.ELECTRICAL),
                START_DATE,
                END_DATE,
                workerId,
                null,
                null,
                null,
                null,
                projectId,
                "task",
                "requirement",
                "memo"
        );
    }

    public static TaskEntity projectEntity(Long projectId, Long workerId, TaskStatus status) {
        val created = projectEntity(projectId, workerId);
        switch (status) {
            case NONE -> {}
            case OPEN -> ReflectionTestUtils.setField(created, "status", TaskStatus.OPEN);
            case OFFERED -> created.offered();
            case ASSIGNED -> {
                created.offered();
                created.assign(workerId);
            }
        }
        return created;
    }

    public static CreateWorkerTask createCommand() {
        return new CreateWorkerTask(
                Set.of(Trade.ELECTRICAL), START_DATE, END_DATE,
                "create", "create", "company", ProfileFactory.DEFAULT_ADDRESS);
    }

    public static UpdateWorkerTask updateCommand() {
        return updateCommand(TaskProgress.TODO);
    }

    public static UpdateWorkerTask updateCommand(TaskProgress progress) {
        return new UpdateWorkerTask(
                Set.of(Trade.DEMOLITION), START_DATE, END_DATE, progress,
                "update", "update", "company", ProfileFactory.DEFAULT_ADDRESS);
    }

    public static CreateProjectTask createProjectCommand(Long projectId) {
        return new CreateProjectTask(
                Set.of(Trade.ELECTRICAL), START_DATE, END_DATE, projectId,
                "create", "create", "create");
    }

    public static UpdateProjectTask updateProjectCommand() {
        return updateProjectCommand(TaskProgress.TODO);
    }

    public static UpdateProjectTask updateProjectCommand(TaskProgress progress) {
        return new UpdateProjectTask(
                Set.of(Trade.DEMOLITION), START_DATE, END_DATE, progress,
                "update", "update", "update");
    }

    public static UpdateAssigneeTask updateAssigneeCommand() {
        return new UpdateAssigneeTask(TaskProgress.TODO, "update", "update");
    }
}
