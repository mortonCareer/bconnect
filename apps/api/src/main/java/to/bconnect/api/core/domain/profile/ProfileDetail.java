package to.bconnect.api.core.domain.profile;

import to.bconnect.api.security.member.Member;
import to.bconnect.api.core.storage.Address;
import to.bconnect.api.core.storage.profile.Trade;

import java.time.LocalDateTime;
import java.util.Set;

public record ProfileDetail(
        Member member,
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
    public static ProfileDetail of(
            Member member,
            Profile profile,
            int postCount,
            int recommendationCount,
            int coworkerCount
    ) {
        return new ProfileDetail(
                member,
                profile.id(),
                profile.memberId(),
                profile.primaryTrade(),
                profile.trades(),
                profile.experience(),
                profile.headline(),
                profile.about(),
                profile.address(),
                profile.createdAt(),
                profile.modifiedAt(),
                postCount,
                recommendationCount,
                coworkerCount
        );
    }
}
