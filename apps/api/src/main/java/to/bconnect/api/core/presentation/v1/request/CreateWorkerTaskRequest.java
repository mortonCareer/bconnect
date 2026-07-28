package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import to.bconnect.api.core.domain.task.CreateWorkerTask;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.profile.Trade;

import java.time.LocalDate;
import java.util.Set;

public record CreateWorkerTaskRequest(
        @NotEmpty Set<Trade> trades,
        @NotNull LocalDate start,
        @NotNull LocalDate end,
        @NotBlank String title,
        String memo,
        String company,
        @Valid Address address
) {
    public CreateWorkerTask toCommand() {
        return new CreateWorkerTask(trades, start, end, title, memo, company, address);
    }
}
