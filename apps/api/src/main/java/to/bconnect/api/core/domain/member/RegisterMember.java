package to.bconnect.api.core.domain.member;

import to.bconnect.api.storage.member.Role;

import java.time.LocalDate;
import java.util.Set;

public record RegisterMember(
        String username,
        String name,
        LocalDate birth,
        boolean marketingConsent,
        Set<Role> roles
) {}
