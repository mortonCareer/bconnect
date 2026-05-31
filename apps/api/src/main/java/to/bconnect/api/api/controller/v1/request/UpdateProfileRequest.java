package to.bconnect.api.api.controller.v1.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import to.bconnect.api.storage.common.Address;
import to.bconnect.api.storage.common.value.Trade;

import java.util.Set;

public record UpdateProfileRequest(
        @NotNull Trade primaryTrade,
        @NotNull @Size(min = 1) Set<Trade> trades,
        @NotNull @PositiveOrZero int experience,
        String headline,
        @NotNull Address address
) {}
