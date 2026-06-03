package to.bconnect.api.api.controller.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import to.bconnect.api.storage.common.Regex;

public record SendCodeRequest(
        @NotBlank
        @Pattern(regexp = Regex.PHONE)
        String phone
) {}
