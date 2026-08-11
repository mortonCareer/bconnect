package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

public record TaskListResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) List<WorkerTaskResponse> workerTasks,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) List<AssigneeTaskResponse> assigneeTasks
) {
}
