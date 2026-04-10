package so.morton.api.api.controller.v1.response;

import so.morton.api.domain.feed.Feed;

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
