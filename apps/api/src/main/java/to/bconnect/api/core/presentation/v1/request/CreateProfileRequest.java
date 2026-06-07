package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import to.bconnect.api.core.storage.Address;
import to.bconnect.api.core.storage.profile.Trade;

import java.util.Set;

public record CreateProfileRequest(
        @NotNull Trade primaryTrade,
        @NotNull @Size(min = 1) Set<Trade> trades,
        @NotNull @PositiveOrZero int experience,
        String headline,
        String about,
        @NotNull Address address
) {}
