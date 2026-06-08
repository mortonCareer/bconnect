package to.bconnect.api.core.domain.profile;

import to.bconnect.api.storage.profile.ProfileEntity;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.profile.Trade;

import java.time.LocalDateTime;
import java.util.Set;

public record Profile(
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
    public static Profile of(ProfileEntity entity) {
        return new Profile(
                entity.getId(),
                entity.getMemberId(),
                entity.getPrimaryTrade(),
                entity.getTrades(),
                entity.getExperience(),
                entity.getHeadline(),
                entity.getAbout(),
                entity.getAddress(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
