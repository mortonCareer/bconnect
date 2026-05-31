package to.bconnect.api.domain.profile;

import to.bconnect.api.storage.domain.profile.ProfileEntity;
import to.bconnect.api.storage.common.Address;
import to.bconnect.api.storage.common.value.Trade;

import java.time.LocalDateTime;
import java.util.Set;
import org.hibernate.Hibernate;

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
        Hibernate.initialize(entity.getTrades());
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
