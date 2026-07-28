package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import to.bconnect.api.core.domain.task.UpdateProjectTask;
import to.bconnect.api.storage.profile.Trade;

import java.time.LocalDate;
import java.util.Set;

public record UpdateProjectTaskRequest(
        @NotEmpty Set<Trade> trades,
        @NotNull LocalDate start,
        @NotNull LocalDate end,
        @NotBlank String title,
        String requirement,
        String memo
) {
    public UpdateProjectTask toCommand() {
        return new UpdateProjectTask(trades, start, end, title, requirement, memo);
    }
}
