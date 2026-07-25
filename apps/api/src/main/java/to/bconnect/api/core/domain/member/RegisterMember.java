package to.bconnect.api.core.domain.member;

import to.bconnect.api.storage.member.Role;

import java.util.Set;

public record RegisterMember(
        String username,
        String name,
        Set<Role> roles
) {}
