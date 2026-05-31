package to.bconnect.api.support.fixture;

import to.bconnect.api.api.controller.v1.request.RegisterMemberRequest;
import to.bconnect.api.api.controller.v1.request.UpdateMemberRequest;
import to.bconnect.api.domain.member.Member;
import to.bconnect.api.storage.domain.member.MemberEntity;
import to.bconnect.api.storage.common.value.Role;

import java.time.LocalDateTime;

public class MemberFactory {

    public static final String PICTURE = "https://placehold.co/200x200";

    public static Member create(Long id) {
        return new Member(id, "username", "name", "phone", PICTURE, Role.FOREMAN,
                LocalDateTime.MIN, LocalDateTime.MIN);
    }

    public static MemberEntity createEntity() {
        return MemberEntity.builder()
                .username("username")
                .name("name")
                .phone("phone")
                .picture(PICTURE)
                .role(Role.FOREMAN)
                .build();
    }

    public static MemberEntity createEntity(String username, String phone, Role role) {
        return MemberEntity.builder()
                .username(username)
                .phone(phone)
                .name("name")
                .picture(PICTURE)
                .role(role)
                .build();
    }

    public static RegisterMemberRequest registerRequest() {
        return new RegisterMemberRequest("signupToken", "username", "name", PICTURE, Role.FOREMAN);
    }

    public static UpdateMemberRequest updateRequest() {
        return new UpdateMemberRequest("name", PICTURE, Role.CONTRACTOR);
    }
}
