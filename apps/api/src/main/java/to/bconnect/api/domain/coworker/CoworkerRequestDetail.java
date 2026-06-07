package to.bconnect.api.domain.coworker;

import to.bconnect.api.security.member.Member;
import to.bconnect.api.domain.profile.Profile;

public record CoworkerRequestDetail(
        Long id,
        Member member,
        Profile profile
) {
    public static CoworkerRequestDetail of(Long id, Member member, Profile profile) {
        return new CoworkerRequestDetail(id, member, profile);
    }
}
