package so.morton.api.api.controller.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import so.morton.api.storage.value.Role;

public record UpdateMemberRequest(
        @NotBlank String name,
        String picture,
        @NotNull Role role
) {}
