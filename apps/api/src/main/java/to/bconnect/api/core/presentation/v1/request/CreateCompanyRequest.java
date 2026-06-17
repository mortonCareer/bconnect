package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.URL;
import to.bconnect.api.core.domain.company.CreateCompany;

public record CreateCompanyRequest(
        @NotBlank String name,
        @NotBlank String brn,
        @URL String picture
) {
    public CreateCompany toCommand() {
        return new CreateCompany(name, brn, picture);
    }
}
