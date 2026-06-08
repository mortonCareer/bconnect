package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.post.Post;
import to.bconnect.api.security.member.Member;

public record FeedResponse(
        MemberSummaryResponse member,
        PostResponse post
) {
    public static FeedResponse of(Post post, Member member) {
        return new FeedResponse(
                MemberSummaryResponse.of(member),
                PostResponse.of(post)
        );
    }
}
