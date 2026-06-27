package to.bconnect.api.core.presentation.v1.request;

import org.hibernate.validator.constraints.URL;

public record UpdateCompanyRequest(
        @URL String picture
) {
}
