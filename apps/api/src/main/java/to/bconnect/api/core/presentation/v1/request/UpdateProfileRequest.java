package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import to.bconnect.api.core.domain.profile.UpdateProfile;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.profile.ProfileRole;
import to.bconnect.api.storage.profile.Trade;

import java.util.Set;

public record UpdateProfileRequest(
        @NotNull ProfileRole role,
        @NotNull Trade primaryTrade,
        @NotEmpty Set<Trade> trades,
        @PositiveOrZero int experience,
        String headline,
        @NotNull Address address
) {
    public UpdateProfile toCommand() {
        return new UpdateProfile(role, primaryTrade, trades, experience, headline, address);
    }
}
