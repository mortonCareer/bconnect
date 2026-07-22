package to.bconnect.api.core.domain.member;

import to.bconnect.api.storage.member.Role;

public record RegisterMember(
        String username,
        String name,
        Role role
) {}
