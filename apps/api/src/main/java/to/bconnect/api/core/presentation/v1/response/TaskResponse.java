package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.offer.Offer;
import to.bconnect.api.core.domain.task.Task;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.profile.Trade;
import to.bconnect.api.storage.task.TaskStatus;
import to.bconnect.api.storage.task.TaskType;

import java.time.LocalDate;
import java.time.Instant;
import java.util.Set;

public record TaskResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) TaskType type,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Set<Trade> trades,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDate start,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDate end,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) TaskStatus status,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) Long workerId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String workerTitle,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String workerMemo,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String workerCompany,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) Address address,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) Long projectId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String projectTitle,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String projectRequirement,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String projectMemo,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) OfferSummaryResponse offer,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant modifiedAt
) {
    public static TaskResponse of(Task task, Address address) {
        return of(task, address, null);
    }

    public static TaskResponse of(Task task, Address address, Offer offer) {
        return new TaskResponse(
                task.id(),
                task.type(),
                task.trades(),
                task.start(),
                task.end(),
                task.status(),
                task.workerId(),
                task.workerTitle(),
                task.workerMemo(),
                task.workerCompany(),
                address,
                task.projectId(),
                task.projectTitle(),
                task.projectRequirement(),
                task.projectMemo(),
                offer == null ? null : OfferSummaryResponse.of(offer),
                task.createdAt(),
                task.modifiedAt()
        );
    }
}
