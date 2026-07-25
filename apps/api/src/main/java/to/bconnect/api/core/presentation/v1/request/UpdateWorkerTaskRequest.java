package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import to.bconnect.api.core.domain.task.UpdateWorkerTask;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.profile.Trade;

import java.time.LocalDate;
import java.util.Set;

public record UpdateWorkerTaskRequest(
        @NotEmpty Set<Trade> trades,
        @NotNull LocalDate start,
        @NotNull LocalDate end,
        @NotBlank String title,
        @NotBlank String memo,
        String company,
        @Valid Address address
) {
    public UpdateWorkerTask toCommand() {
        return new UpdateWorkerTask(trades, start, end, title, memo, company, address);
    }
}
