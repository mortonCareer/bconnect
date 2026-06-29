package to.bconnect.api.security.member;

import to.bconnect.api.storage.member.Role;

public record UpdateMember(
        String name,
        Long pictureId,
        Role role
) {}
