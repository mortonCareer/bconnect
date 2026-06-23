package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import to.bconnect.api.core.domain.task.CreateProjectTask;
import to.bconnect.api.storage.profile.Trade;

import java.time.LocalDate;
import java.util.Set;

public record CreateProjectTaskRequest(
        @NotNull Set<Trade> trades,
        @NotNull LocalDate start,
        @NotNull LocalDate end,
        @NotNull Long projectId,
        @NotBlank String title,
        @NotBlank String requirement,
        @NotBlank String memo
) {
    public CreateProjectTask toCommand() {
        return new CreateProjectTask(trades, start, end, projectId, title, requirement, memo);
    }
}
