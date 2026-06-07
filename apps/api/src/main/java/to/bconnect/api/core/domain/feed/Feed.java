package to.bconnect.api.core.domain.feed;

import to.bconnect.api.security.member.Member;
import to.bconnect.api.core.domain.post.Post;
import to.bconnect.api.core.domain.profile.Profile;

public record Feed(
        Member member,
        Profile profile,
        Post post
) { }
