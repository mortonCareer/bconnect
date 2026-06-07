package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.post.Feed;
import to.bconnect.api.security.member.MaskedMemberResponse;

public record FeedResponse(
        MaskedMemberResponse member,
        ProfileResponse profile,
        PostResponse post
) {
    public static FeedResponse of(Feed feed) {
        return new FeedResponse(
                MaskedMemberResponse.of(feed.member()),
                ProfileResponse.of(feed.profile()),
                PostResponse.of(feed.post())
        );
    }
}
