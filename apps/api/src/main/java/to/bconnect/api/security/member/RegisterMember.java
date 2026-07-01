package to.bconnect.api.security.member;

import to.bconnect.api.storage.member.Role;

public record RegisterMember(
        String phone,
        String signupToken,
        String username,
        String name,
        Long pictureId,
        Role role
) {}
