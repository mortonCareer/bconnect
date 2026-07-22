package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import to.bconnect.api.core.domain.company.CreateCompany;

public record CreateCompanyRequest(
        @NotBlank String name,
        @NotBlank String brn,
        Long pictureId
) {
    public CreateCompany toCommand() {
        return new CreateCompany(name, brn, pictureId);
    }
}
