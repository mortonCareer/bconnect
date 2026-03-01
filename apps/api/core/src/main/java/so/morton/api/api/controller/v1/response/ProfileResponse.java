package so.morton.api.api.controller.v1.response;

import so.morton.api.domain.profile.Profile;
import so.morton.api.storage.support.Address;
import so.morton.api.storage.value.Trade;

import java.time.LocalDateTime;
import java.util.Set;

public record ProfileResponse(
        Long id,
        Long memberId,
        Trade primaryTrade,
        Set<Trade> trades,
        int experience,
        String headline,
        String about,
        Address address,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static ProfileResponse of(Profile profile) {
        return new ProfileResponse(
                profile.id(),
                profile.memberId(),
                profile.primaryTrade(),
                profile.trades(),
                profile.experience(),
                profile.headline(),
                profile.about(),
                profile.address(),
                profile.createdAt(),
                profile.modifiedAt()
        );
    }
}
