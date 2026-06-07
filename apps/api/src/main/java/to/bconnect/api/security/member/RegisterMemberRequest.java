package to.bconnect.api.security.member;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.validator.constraints.URL;
import to.bconnect.api.core.storage.member.Role;

public record RegisterMemberRequest(
        @NotBlank String phone,
        @NotBlank String signupToken,
        @NotBlank String username,
        @NotBlank String name,
        @URL String picture,
        @NotNull Role role
) {}
