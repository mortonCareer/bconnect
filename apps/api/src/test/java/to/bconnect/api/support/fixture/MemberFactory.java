package to.bconnect.api.support.fixture;

import to.bconnect.api.security.member.RegisterMemberRequest;
import to.bconnect.api.security.member.UpdateMemberRequest;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.storage.member.MemberEntity;
import to.bconnect.api.storage.member.Role;

import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class MemberFactory {

    public static final Long DEFAULT_PICTURE_ID = 1L;

    public static Member create(Long id) {
        return new Member(id, "username", "name", "phone", DEFAULT_PICTURE_ID, Role.WORKER,
                MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static MemberEntity createEntity() {
        return new MemberEntity("username", "name", "phone", DEFAULT_PICTURE_ID, Role.WORKER);
    }

    public static MemberEntity createEntity(String username, String phone, Role role) {
        return new MemberEntity(username, "name", phone, DEFAULT_PICTURE_ID, role);
    }

    public static RegisterMemberRequest registerRequest() {
        return new RegisterMemberRequest("phone", "signupToken", "username", "name", DEFAULT_PICTURE_ID, Role.WORKER);
    }

    public static UpdateMemberRequest updateRequest() {
        return new UpdateMemberRequest("name", DEFAULT_PICTURE_ID, Role.CONTRACTOR);
    }
}
