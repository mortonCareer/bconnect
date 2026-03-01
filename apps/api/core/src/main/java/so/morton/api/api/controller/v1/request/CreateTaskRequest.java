package so.morton.api.api.controller.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import so.morton.api.storage.support.Address;
import so.morton.api.storage.value.Trade;

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
