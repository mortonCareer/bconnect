package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;

public record UnregisterDeviceRequest(
        @NotBlank String token
) {}
