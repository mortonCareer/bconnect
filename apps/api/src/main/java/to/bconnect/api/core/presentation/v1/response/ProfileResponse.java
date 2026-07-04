package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.domain.member.Member;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.profile.ProfileRole;
import to.bconnect.api.storage.profile.Trade;

import java.time.LocalDateTime;
import java.util.Set;

public record ProfileResponse(
        Long id,
        MemberSummaryResponse member,
        ProfileRole role,
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
    public static ProfileResponse of(Profile detail, Member member, String picture) {
        return new ProfileResponse(
                detail.id(),
                MemberSummaryResponse.of(member, picture),
                detail.role(),
                detail.primaryTrade(),
                detail.trades(),
                detail.experience(),
                detail.headline(),
                detail.about(),
                detail.address(),
                detail.createdAt(),
                detail.modifiedAt(),
                detail.postCount().intValue(),
                detail.recommendationCount().intValue(),
                detail.coworkerCount().intValue()
        );
    }
}
