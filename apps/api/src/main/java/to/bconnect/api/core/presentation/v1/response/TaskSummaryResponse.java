package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.task.Task;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.profile.Trade;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;

public record TaskSummaryResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Set<Trade> trades,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDate start,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDate end,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String company,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) Address address,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant modifiedAt
) {
    public static TaskSummaryResponse of(Task task, String company, Address address) {
        return new TaskSummaryResponse(
                task.id(),
                task.trades(),
                task.start(),
                task.end(),
                company,
                address,
                task.createdAt(),
                task.modifiedAt()
        );
    }
}
