package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.post.Post;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.security.member.Member;

import java.util.List;

public record FeedResponse(
        MemberSummaryResponse member,
        ProfileSummaryResponse profile,
        PostResponse post
) {
    public static FeedResponse of(Post post, Member member, Profile profile, List<String> images, String picture) {
        return new FeedResponse(
                MemberSummaryResponse.of(member),
                profile == null ? null : ProfileSummaryResponse.of(profile, picture),
                PostResponse.of(post, images)
        );
    }
}
