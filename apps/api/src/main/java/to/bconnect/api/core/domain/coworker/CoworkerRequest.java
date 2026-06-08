package to.bconnect.api.core.domain.coworker;

import to.bconnect.api.security.member.Member;


public record CoworkerRequest(
    Long id,
    Member member
) {}
