package to.bconnect.api.core.presentation.v1.request;

import org.hibernate.validator.constraints.URL;
import to.bconnect.api.core.domain.company.UpdateCompany;

public record UpdateCompanyRequest(
        @URL String picture
) {
    public UpdateCompany toCommand() {
        return new UpdateCompany(picture);
    }
}
