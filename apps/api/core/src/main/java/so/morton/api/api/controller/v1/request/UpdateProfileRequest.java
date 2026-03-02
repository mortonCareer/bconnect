package so.morton.api.api.controller.v1.request;

import jakarta.validation.constraints.NotNull;
import so.morton.api.storage.support.Address;
import so.morton.api.storage.value.Trade;

import java.util.Set;

public record UpdateProfileRequest(
        @NotNull Trade primaryTrade,
        @NotNull Set<Trade> trades,
        int experience,
        String headline,
        @NotNull Address address
) {}
