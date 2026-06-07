package to.bconnect.api.core.domain.post;

import to.bconnect.api.security.member.Member;
import to.bconnect.api.core.domain.profile.Profile;

public record Feed(
        Member member,
        Profile profile,
        Post post
) { }
