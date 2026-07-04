package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.core.domain.member.RegisterMember;

public record RegisterMemberRequest(
        @NotBlank String username,
        @NotBlank String name,
        Long pictureId,
        @NotNull Role role
) {
    public RegisterMember toCommand() {
        if (role == Role.ADMIN || role == Role.GUEST)
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        return new RegisterMember(username, name, pictureId, role);
    }
}
