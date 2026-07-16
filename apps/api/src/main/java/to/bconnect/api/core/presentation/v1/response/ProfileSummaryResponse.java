package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.profile.Trade;

import java.util.Set;

public record ProfileSummaryResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Trade primaryTrade,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) int experience,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String headline,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Address address
) {
    public static ProfileSummaryResponse of(Profile profile) {
        return new ProfileSummaryResponse(
                profile.primaryTrade(),
                profile.experience(),
                profile.headline(),
                profile.address()
        );
    }
}
