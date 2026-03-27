package so.morton.api.api.controller.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import so.morton.api.storage.support.Regex;
import so.morton.api.storage.value.Role;

public record RegisterMemberRequest(
        @NotBlank String signupToken,
        @NotBlank String username,
        @NotBlank String name,
        @NotBlank @Pattern(regexp = Regex.PHONE) String phone,
        @NotNull String picture,
        @NotNull Role role
) {}
