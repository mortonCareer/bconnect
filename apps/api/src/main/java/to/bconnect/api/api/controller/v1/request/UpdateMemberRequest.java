package to.bconnect.api.api.controller.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.validator.constraints.URL;
import to.bconnect.api.storage.common.value.Role;

public record UpdateMemberRequest(
        @NotBlank String name,
        @URL String picture,
        @NotNull Role role
) {}
