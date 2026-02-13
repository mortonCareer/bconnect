package so.morton.api.api.controller.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import so.morton.api.storage.support.Regex;

public record SendOtpRequest(
        @NotBlank
        @Pattern(regexp = Regex.PHONE)
        String phone
) {}
