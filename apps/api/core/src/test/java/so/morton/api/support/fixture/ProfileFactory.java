package so.morton.api.support.fixture;

import so.morton.api.api.controller.v1.request.CreateProfileRequest;
import so.morton.api.api.controller.v1.request.UpdateProfileRequest;
import so.morton.api.domain.profile.Profile;
import so.morton.api.storage.domain.profile.ProfileEntity;
import so.morton.api.storage.support.Address;
import so.morton.api.storage.value.Trade;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

public class ProfileFactory {

    public static final Address ADDRESS = new Address(
            "00000", "city", "state", "street", "detail",
            BigDecimal.ZERO, BigDecimal.ZERO
    );

    public static Profile create(Long id, Long memberId) {
        return new Profile(id, memberId, Trade.ELECTRICAL, Set.of(Trade.ELECTRICAL),
                5, "headline", "about", ADDRESS,
                LocalDateTime.MIN, LocalDateTime.MIN);
    }

    public static ProfileEntity createEntity(Long memberId) {
        return ProfileEntity.builder()
                .memberId(memberId)
                .primaryTrade(Trade.ELECTRICAL)
                .trades(Set.of(Trade.ELECTRICAL))
                .experience(5)
                .headline("headline")
                .about("about")
                .address(ADDRESS)
                .build();
    }

    public static CreateProfileRequest createRequest() {
        return new CreateProfileRequest(
                Trade.ELECTRICAL, Set.of(Trade.ELECTRICAL), 5,
                "headline", "about", ADDRESS);
    }

    public static UpdateProfileRequest updateRequest() {
        return new UpdateProfileRequest(
                Trade.ELECTRICAL, Set.of(Trade.ELECTRICAL, Trade.PLUMBING), 10,
                "Updated Headline", ADDRESS);
    }
}
