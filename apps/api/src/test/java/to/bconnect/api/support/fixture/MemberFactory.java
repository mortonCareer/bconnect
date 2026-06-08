package to.bconnect.api.support.fixture;

import to.bconnect.api.security.member.RegisterMemberRequest;
import to.bconnect.api.security.member.UpdateMemberRequest;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.storage.member.MemberEntity;
import to.bconnect.api.storage.member.Role;

import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class MemberFactory {

    public static final String DEFAULT_PICTURE = "https://image.com";

    public static Member create(Long id) {
        return new Member(id, "username", "name", "phone", DEFAULT_PICTURE, Role.FOREMAN,
                MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static MemberEntity createEntity() {
        return MemberEntity.builder()
                .username("username")
                .name("name")
                .phone("phone")
                .picture(DEFAULT_PICTURE)
                .role(Role.FOREMAN)
                .build();
    }

    public static MemberEntity createEntity(String username, String phone, Role role) {
        return MemberEntity.builder()
                .username(username)
                .phone(phone)
                .name("name")
                .picture(DEFAULT_PICTURE)
                .role(role)
                .build();
    }

    public static RegisterMemberRequest registerRequest() {
        return new RegisterMemberRequest("phone", "signupToken", "username", "name", DEFAULT_PICTURE, Role.FOREMAN);
    }

    public static UpdateMemberRequest updateRequest() {
        return new UpdateMemberRequest("name", DEFAULT_PICTURE, Role.CONTRACTOR);
    }
}
