package to.bconnect.api.core.domain.post;

import to.bconnect.api.security.member.Member;

public record Feed(
        Member member,
        Post post
) { }
