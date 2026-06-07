package to.bconnect.api.core.domain.coworker;

import to.bconnect.api.security.member.Member;
import to.bconnect.api.core.domain.profile.Profile;

public record CoworkerProfile(
        Long id,
        Member member,
        Profile profile
) {
    public static CoworkerProfile of(Long id, Member member, Profile profile) {
        return new CoworkerProfile(id, member, profile);
    }
}
