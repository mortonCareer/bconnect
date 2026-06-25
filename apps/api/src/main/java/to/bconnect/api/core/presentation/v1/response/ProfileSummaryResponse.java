package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.profile.Trade;

import java.util.Set;

public record ProfileSummaryResponse(
        Trade primaryTrade,
        int experience,
        String headline,
        Address address,
        String picture
) {
    public static ProfileSummaryResponse of(Profile profile, String picture) {
        return new ProfileSummaryResponse(
                profile.primaryTrade(),
                profile.experience(),
                profile.headline(),
                profile.address(),
                picture
        );
    }
}
