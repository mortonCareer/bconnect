package so.morton.api.domain.coworker;

import so.morton.api.domain.member.Member;
import so.morton.api.domain.profile.Profile;

public record CoworkerRequestDetail(
        Long id,
        Member member,
        Profile profile
) {
    public static CoworkerRequestDetail of(Long id, Member member, Profile profile) {
        return new CoworkerRequestDetail(id, member, profile);
    }
}
