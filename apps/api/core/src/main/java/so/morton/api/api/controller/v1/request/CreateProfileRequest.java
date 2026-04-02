package so.morton.api.api.controller.v1.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import so.morton.api.storage.support.Address;
import so.morton.api.storage.value.Trade;

import java.util.Set;

public record CreateProfileRequest(
        @NotNull Trade primaryTrade,
        @NotNull Set<Trade> trades,
        @NotNull @PositiveOrZero int experience,
        String headline,
        String about,
        @NotNull Address address
) {}
