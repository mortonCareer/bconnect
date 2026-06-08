package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.profile.Trade;

import java.time.LocalDate;
import java.util.Set;

public record CreateTaskRequest(
        @NotBlank String company,
        @NotNull Address address,
        @NotBlank String taskTitle,
        @NotBlank String eventTitle,
        @NotNull Set<Trade> trades,
        @NotNull LocalDate start,
        @NotNull LocalDate end
) {}
