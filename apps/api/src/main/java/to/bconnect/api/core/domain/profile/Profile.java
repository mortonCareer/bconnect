package to.bconnect.api.core.domain.profile;

import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.profile.ProfileEntity;
import to.bconnect.api.storage.profile.ProfileRole;
import to.bconnect.api.storage.profile.Trade;

import java.time.Instant;
import java.util.Set;

public record Profile(
    Long id,
    Long memberId,
    ProfileRole role,
    Trade primaryTrade,
    Set<Trade> trades,
    int experience,
    String headline,
    String about,
    Address address,
    Instant createdAt,
    Instant modifiedAt,
    Long postCount,
    Long recommendationCount,
    Long coworkerCount
) {
    public static Profile of(ProfileEntity entity) {
        return of(entity, 0L, 0L, 0L);
    }

    public static Profile of(ProfileEntity entity, Long postCount, Long recommendationCount, Long coworkerCount) {
        return new Profile(
                entity.getId(),
                entity.getMemberId(),
                entity.getRole(),
                entity.getPrimaryTrade(),
                entity.getTrades(),
                entity.getExperience(),
                entity.getHeadline(),
                entity.getAbout(),
                entity.getAddress(),
                entity.getCreatedAt(),
                entity.getModifiedAt(),
                postCount,
                recommendationCount,
                coworkerCount
        );
    }
}
