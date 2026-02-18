package so.morton.api.domain.profile;

import so.morton.api.storage.domain.profile.ProfileEntity;
import so.morton.api.storage.support.Address;
import so.morton.api.storage.value.Trade;

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
    public void validate() {
        if (!trades.contains(primaryTrade)) {
            throw new IllegalArgumentException("주 직종은 보유 직종에 포함되어야 합니다");
        }
    }

    public static Profile of(ProfileEntity entity) {
        Profile profile = new Profile(
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
        profile.validate();
        return profile;
    }
}
