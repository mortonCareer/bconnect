package to.bconnect.api.security.member;

import jakarta.validation.constraints.NotBlank;

public record UpdateMemberRequest(
        @NotBlank String name,
        Long pictureId
) {
    public UpdateMember toCommand() {
        return new UpdateMember(name, pictureId);
    }
}
