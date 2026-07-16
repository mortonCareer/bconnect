package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.task.Task;

import java.time.LocalDate;

public record CoworkerTaskResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long memberId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDate start,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDate end
) {
    public static CoworkerTaskResponse of(Task task) {
        return new CoworkerTaskResponse(task.id(), task.workerId(), task.start(), task.end());
    }
}
