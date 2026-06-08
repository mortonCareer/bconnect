package to.bconnect.api.core.domain.coworker;

import to.bconnect.api.security.member.Member;
import to.bconnect.api.core.domain.profile.Profile;

public record CoworkerMember(
        Long id,
        Member member
) {
    public static CoworkerMember of(Long id, Member member) {
        return new CoworkerMember(id, member);
    }
}
