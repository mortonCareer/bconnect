package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import to.bconnect.api.core.domain.task.UpdateAssigneeTask;
import to.bconnect.api.storage.task.TaskProgress;

public record UpdateAssigneeTaskRequest(
        @NotNull TaskProgress progress,
        @NotBlank String title,
        String memo
) {
    public UpdateAssigneeTask toCommand() {
        return new UpdateAssigneeTask(progress, title, memo);
    }
}
