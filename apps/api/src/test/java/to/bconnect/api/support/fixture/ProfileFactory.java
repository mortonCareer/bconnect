package to.bconnect.api.support.fixture;

import to.bconnect.api.core.presentation.v1.request.CreateProfileRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateProfileRequest;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.storage.profile.ProfileEntity;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.profile.Trade;

import java.math.BigDecimal;
import java.util.Set;

import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class ProfileFactory {

    public static final Address DEFAULT_ADDRESS = new Address(
            "00000", "city", "state", "street", "detail",
            BigDecimal.ZERO, BigDecimal.ZERO
    );

    public static Profile create(Long id, Member member) {
        return new Profile(id, member, Trade.ELECTRICAL, Set.of(Trade.ELECTRICAL),
                5, "headline", "about", DEFAULT_ADDRESS,
                MIN_DATE_TIME, MIN_DATE_TIME, 0L, 0L, 0L);
    }

    public static ProfileEntity createEntity(Long memberId) {
        return ProfileEntity.builder()
                .memberId(memberId)
                .primaryTrade(Trade.ELECTRICAL)
                .trades(Set.of(Trade.ELECTRICAL))
                .experience(5)
                .headline("headline")
                .about("about")
                .address(DEFAULT_ADDRESS)
                .build();
    }

    public static CreateProfileRequest createRequest() {
        return new CreateProfileRequest(
                Trade.ELECTRICAL, Set.of(Trade.ELECTRICAL), 5,
                "headline", "about", DEFAULT_ADDRESS);
    }

    public static UpdateProfileRequest updateRequest() {
        return new UpdateProfileRequest(
                Trade.ELECTRICAL, Set.of(Trade.ELECTRICAL, Trade.PLUMBING), 10,
                "Updated Headline", DEFAULT_ADDRESS);
    }
}
