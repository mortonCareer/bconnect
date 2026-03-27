package so.morton.api.api.controller.v1.response;

import so.morton.api.domain.feed.Feed;
import so.morton.api.domain.member.Member;
import so.morton.api.domain.post.Post;
import so.morton.api.domain.profile.Profile;
import so.morton.api.storage.value.Role;
import so.morton.api.storage.value.Trade;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public record FeedResponse(
        FeedMember member,
        FeedProfile profile,
        FeedPost post
) {
    public static FeedResponse of(Feed feed) {
        return new FeedResponse(
                FeedMember.of(feed.member()),
                FeedProfile.of(feed.profile()),
                FeedPost.of(feed.post())
        );
    }

    public record FeedMember(
            Long id,
            String username,
            String name,
            String picture,
            Role role,
            LocalDateTime createdAt,
            LocalDateTime modifiedAt
    ) {
        public static FeedMember of(Member member) {
            return new FeedMember(
                    member.id(),
                    member.username(),
                    member.name(),
                    member.picture(),
                    member.role(),
                    member.createdAt(),
                    member.modifiedAt()
            );
        }
    }

    public record FeedProfile(
            Long id,
            Trade primaryTrade,
            Set<Trade> trades,
            int experience,
            String headline,
            LocalDateTime createdAt,
            LocalDateTime modifiedAt
    ) {
        public static FeedProfile of(Profile profile) {
            return new FeedProfile(
                    profile.id(),
                    profile.primaryTrade(),
                    profile.trades(),
                    profile.experience(),
                    profile.headline(),
                    profile.createdAt(),
                    profile.modifiedAt()
            );
        }
    }

    public record FeedPost(
            Long id,
            List<String> images,
            String content,
            LocalDateTime createdAt,
            LocalDateTime modifiedAt
    ) {
        public static FeedPost of(Post post) {
            return new FeedPost(
                    post.id(),
                    post.images(),
                    post.content(),
                    post.createdAt(),
                    post.modifiedAt()
            );
        }
    }
}