package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.core.domain.member.RegisterMember;

import java.util.Set;

public record RegisterMemberRequest(
        @NotBlank String username,
        @NotBlank String name
) {
    public RegisterMember toCommand() {
        return new RegisterMember(username, name, Set.of(Role.GUEST));
    }
}
