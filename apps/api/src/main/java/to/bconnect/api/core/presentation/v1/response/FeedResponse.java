package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.post.Post;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.domain.member.Member;

import java.util.List;

public record FeedResponse(
        MemberSummaryResponse member,
        ProfileSummaryResponse profile,
        PostResponse post
) {
    public static FeedResponse of(Post post, Member member, Profile profile, List<String> images, String picture) {
        return new FeedResponse(
                MemberSummaryResponse.of(member, picture),
                profile == null ? null : ProfileSummaryResponse.of(profile),
                PostResponse.of(post, images)
        );
    }
}
