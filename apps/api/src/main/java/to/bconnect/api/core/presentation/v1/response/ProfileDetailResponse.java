package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.profile.ProfileDetail;
import to.bconnect.api.security.member.MaskedMemberResponse;
import to.bconnect.api.core.storage.Address;
import to.bconnect.api.core.storage.profile.Trade;

import java.time.LocalDateTime;
import java.util.Set;

public record ProfileDetailResponse(
        MaskedMemberResponse member,
        Long id,
        Long memberId,
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
                MaskedMemberResponse.of(detail.member()),
                detail.id(),
                detail.memberId(),
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
