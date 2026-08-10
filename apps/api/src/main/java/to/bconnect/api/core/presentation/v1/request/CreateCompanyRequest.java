package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import to.bconnect.api.core.domain.company.CreateCompany;

public record CreateCompanyRequest(
        @NotBlank String name,
        @NotBlank String brn,
        Long pictureId,
        @NotNull Long attachmentId
) {
    public CreateCompany toCommand() {
        return new CreateCompany(name, brn, pictureId, attachmentId);
    }
}
