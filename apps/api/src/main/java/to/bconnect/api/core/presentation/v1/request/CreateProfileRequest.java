package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import to.bconnect.api.core.domain.profile.CreateProfile;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.profile.ProfileRole;
import to.bconnect.api.storage.profile.Trade;

import java.util.Set;

public record CreateProfileRequest(
        @NotNull ProfileRole role,
        @NotNull Trade primaryTrade,
        @NotEmpty Set<Trade> trades,
        @PositiveOrZero int experience,
        String headline,
        String about,
        @NotNull Address address
) {
    public CreateProfile toCommand() {
        return new CreateProfile(role, primaryTrade, trades, experience, headline, about, address);
    }
}
