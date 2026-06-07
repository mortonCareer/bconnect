package to.bconnect.api.security.otp;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import to.bconnect.api.storage.Regex;

public record SendCodeRequest(
        @NotBlank
        @Pattern(regexp = Regex.PHONE)
        String phone
) {}
