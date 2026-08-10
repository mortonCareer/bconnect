package to.bconnect.api.support.fixture;

import to.bconnect.api.core.domain.profile.CreateProfile;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.domain.profile.UpdateProfile;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.Region;
import to.bconnect.api.storage.profile.ProfileEntity;
import to.bconnect.api.storage.profile.ProfileRole;
import to.bconnect.api.storage.profile.Trade;

import java.math.BigDecimal;
import java.util.Set;

import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class ProfileFactory {

    public static final Address DEFAULT_ADDRESS = new Address(
            "00000", "0000000000", Region.서울, "city", "street", "detail",
            BigDecimal.ZERO, BigDecimal.ZERO
    );

    public static Profile domain(Long id, Long memberId) {
        return new Profile(id, memberId, ProfileRole.FOREMAN, Trade.ELECTRICAL, Set.of(Trade.ELECTRICAL),
                5, "headline", "about", DEFAULT_ADDRESS,
                MIN_DATE_TIME, MIN_DATE_TIME, 0L, 0L, 0L);
    }

    public static ProfileEntity entity(Long memberId) {
        return new ProfileEntity(
                memberId,
                ProfileRole.FOREMAN,
                Trade.ELECTRICAL,
                Set.of(Trade.ELECTRICAL),
                5,
                "headline",
                "about",
                DEFAULT_ADDRESS
        );
    }

    public static CreateProfile createCommand() {
        return new CreateProfile(
                ProfileRole.FOREMAN, Trade.ELECTRICAL, Set.of(Trade.ELECTRICAL), 5,
                "headline", "about", DEFAULT_ADDRESS);
    }

    public static UpdateProfile updateCommand() {
        return new UpdateProfile(
                ProfileRole.FOREMAN, Trade.ELECTRICAL, Set.of(Trade.ELECTRICAL, Trade.PLUMBING), 10,
                "Updated Headline", DEFAULT_ADDRESS);
    }
}
