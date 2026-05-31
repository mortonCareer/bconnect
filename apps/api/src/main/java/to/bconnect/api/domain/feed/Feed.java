package to.bconnect.api.domain.feed;

import to.bconnect.api.domain.member.Member;
import to.bconnect.api.domain.post.Post;
import to.bconnect.api.domain.profile.Profile;

public record Feed(
        Member member,
        Profile profile,
        Post post
) { }
