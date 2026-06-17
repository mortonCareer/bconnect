package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import to.bconnect.api.core.domain.task.UpdateAssigneeTask;

public record UpdateAssigneeTaskRequest(
        @NotBlank String title,
        @NotBlank String memo
) {
    public UpdateAssigneeTask toCommand() {
        return new UpdateAssigneeTask(title, memo);
    }
}
