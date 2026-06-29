package to.bconnect.api.security.member;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.member.Role;

public record UpdateMemberRequest(
        @NotBlank String name,
        Long pictureId,
        @NotNull Role role
) {
    public UpdateMember toCommand() {
        if (role == Role.ADMIN || role == Role.GUEST)
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        return new UpdateMember(name, pictureId, role);
    }
}
