package to.bconnect.api.security.member;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.member.Role;

public record RegisterMemberRequest(
        @NotBlank String phone,
        @NotBlank String signupToken,
        @NotBlank String username,
        @NotBlank String name,
        Long pictureId,
        @NotNull Role role
) {
    public RegisterMember toCommand() {
        if (role == Role.ADMIN)
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        return new RegisterMember(phone, signupToken, username, name, pictureId, role);
    }
}
