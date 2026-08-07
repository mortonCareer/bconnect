package to.bconnect.api.support.fixture;

import to.bconnect.api.core.domain.member.Member;
import to.bconnect.api.core.domain.member.RegisterMember;
import to.bconnect.api.core.domain.member.UpdateMember;
import to.bconnect.api.storage.member.MemberEntity;
import to.bconnect.api.storage.member.Role;

import java.time.LocalDate;
import java.util.Set;

import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE;
import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class MemberFactory {

    public static Member domain(Long id) {
        return new Member(id, "username", "name", "phone", MIN_DATE, true, Set.of(Role.CAREER),
                MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static MemberEntity entity() {
        return new MemberEntity("username", "name", "phone", MIN_DATE, true, Set.of(Role.CAREER));
    }

    public static MemberEntity entity(String username, String phone, Role... roles) {
        return new MemberEntity(username, "name", phone, MIN_DATE, true, Set.of(roles));
    }

    public static RegisterMember registerCommand() {
        return new RegisterMember("username", "name", MIN_DATE, true, Set.of(Role.GUEST));
    }

    public static RegisterMember registerCommand(LocalDate birth) {
        return new RegisterMember("username", "name", birth, true, Set.of(Role.GUEST));
    }

    public static UpdateMember updateCommand() {
        return new UpdateMember("updated name");
    }
}
