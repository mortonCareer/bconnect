package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.task.UpdateProjectTask;
import to.bconnect.api.storage.profile.Trade;
import to.bconnect.api.storage.task.TaskProgress;

import java.time.LocalDate;
import java.util.Set;

public record UpdateProjectTaskRequest(
        @NotEmpty Set<Trade> trades,
        @NotNull LocalDate start,
        @NotNull LocalDate end,
        @NotNull TaskProgress progress,
        @NotBlank String title,
        String requirement,
        String memo
) {
    public UpdateProjectTask toCommand() {
        if (end.isBefore(start))
            throw new CodeException(CommonExceptionCode.NOT_VALID);

        return new UpdateProjectTask(trades, start, end, progress, title, requirement, memo);
    }
}
