package to.bconnect.api.api.controller.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import to.bconnect.api.storage.common.Address;
import to.bconnect.api.storage.common.value.Trade;

import java.time.LocalDate;
import java.util.Set;

public record UpdateTaskRequest(
        @NotBlank String company,
        @NotNull Address address,
        @NotBlank String taskTitle,
        @NotBlank String eventTitle,
        @NotNull Set<Trade> trades,
        @NotNull LocalDate start,
        @NotNull LocalDate end
) {}
