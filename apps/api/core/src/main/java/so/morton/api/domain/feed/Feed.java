package so.morton.api.domain.feed;

import so.morton.api.domain.member.Member;
import so.morton.api.domain.post.Post;
import so.morton.api.domain.profile.Profile;

public record Feed(
        Member member,
        Profile profile,
        Post post
) { }
