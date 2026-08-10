package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.core.domain.member.RegisterMember;

import java.time.LocalDate;
import java.util.Set;

public record RegisterMemberRequest(
        @NotBlank String username,
        @NotBlank String name,
        @NotNull LocalDate birth,
        boolean marketingConsent
) {
    public RegisterMember toCommand() {
        return new RegisterMember(username, name, birth, marketingConsent, Set.of(Role.GUEST));
    }
}
