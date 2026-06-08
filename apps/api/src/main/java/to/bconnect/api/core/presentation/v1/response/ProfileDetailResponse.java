package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.profile.ProfileDetail;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.profile.Trade;

import java.time.LocalDateTime;
import java.util.Set;

public record ProfileDetailResponse(
        Long id,
        MaskedMemberResponse member,
        Trade primaryTrade,
        Set<Trade> trades,
        int experience,
        String headline,
        String about,
        Address address,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt,
        int postCount,
        int recommendationCount,
        int coworkerCount
) {
    public static ProfileDetailResponse of(ProfileDetail detail) {
        return new ProfileDetailResponse(
                detail.id(),
                MaskedMemberResponse.of(detail.member()),
                detail.primaryTrade(),
                detail.trades(),
                detail.experience(),
                detail.headline(),
                detail.about(),
                detail.address(),
                detail.createdAt(),
                detail.modifiedAt(),
                detail.postCount(),
                detail.recommendationCount(),
                detail.coworkerCount()
        );
    }
}
