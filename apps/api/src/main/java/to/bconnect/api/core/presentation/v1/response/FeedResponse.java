package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.post.Feed;

public record FeedResponse(
        MaskedMemberResponse member,
        PostResponse post
) {
    public static FeedResponse of(Feed feed) {
        return new FeedResponse(
                MaskedMemberResponse.of(feed.member()),
                new PostResponse(
                        feed.id(),
                        feed.member().id(),
                        feed.taskId(),
                        feed.images(),
                        feed.content(),
                        feed.createdAt(),
                        feed.modifiedAt()
                )
        );
    }
}
