package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import to.bconnect.api.core.domain.task.CreateWorkerTask;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.profile.Trade;

import java.time.LocalDate;
import java.util.Set;

public record CreateWorkerTaskRequest(
        @NotNull Set<Trade> trades,
        @NotNull LocalDate start,
        @NotNull LocalDate end,
        @NotBlank String title,
        @NotBlank String memo,
        String company,
        Address address
) {
    public CreateWorkerTask toCommand() {
        return new CreateWorkerTask(trades, start, end, title, memo, company, address);
    }
}
