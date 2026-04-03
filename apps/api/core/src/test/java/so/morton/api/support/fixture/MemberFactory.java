package so.morton.api.support.fixture;

import so.morton.api.api.controller.v1.request.RegisterMemberRequest;
import so.morton.api.api.controller.v1.request.UpdateMemberRequest;
import so.morton.api.domain.member.Member;
import so.morton.api.storage.domain.member.MemberEntity;
import so.morton.api.storage.value.Role;

import java.time.LocalDateTime;

public class MemberFactory {

    public static Member create(Long id) {
        return new Member(id, "username", "name", "phone", "picture", Role.FOREMAN,
                LocalDateTime.MIN, LocalDateTime.MIN);
    }

    public static MemberEntity createEntity() {
        return MemberEntity.builder()
                .username("username")
                .name("name")
                .phone("phone")
                .picture("picture")
                .role(Role.FOREMAN)
                .build();
    }

    public static MemberEntity createEntity(String username, String phone, Role role) {
        return MemberEntity.builder()
                .username(username)
                .phone(phone)
                .name("name")
                .picture("picture")
                .role(role)
                .build();
    }

    public static RegisterMemberRequest registerRequest() {
        return new RegisterMemberRequest("signupToken", "username", "name", "01000000000", "picture", Role.FOREMAN);
    }

    public static UpdateMemberRequest updateRequest() {
        return new UpdateMemberRequest("name", "picture", Role.CONTRACTOR);
    }
}
