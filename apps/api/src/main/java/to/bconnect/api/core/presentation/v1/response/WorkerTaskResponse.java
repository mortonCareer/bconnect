package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.task.Task;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.profile.Trade;
import to.bconnect.api.storage.task.TaskProgress;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;

public record WorkerTaskResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Set<Trade> trades,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDate start,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDate end,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) TaskProgress progress,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long workerId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String title,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String memo,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String company,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) Address address,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant modifiedAt
) {
    public static WorkerTaskResponse of(Task task) {
        return new WorkerTaskResponse(
                task.id(),
                task.trades(),
                task.start(),
                task.end(),
                task.progress(),
                task.workerId(),
                task.workerTitle(),
                task.workerMemo(),
                task.workerCompany(),
                task.workerAddress(),
                task.createdAt(),
                task.modifiedAt()
        );
    }
}
