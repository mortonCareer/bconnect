package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import to.bconnect.api.core.domain.member.UpdateMember;

public record UpdateMemberRequest(
        @NotBlank String name,
        Long pictureId
) {
    public UpdateMember toCommand() {
        return new UpdateMember(name, pictureId);
    }
}
