package to.bconnect.api.notification.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;

public record UnregisterDeviceRequest(
        @NotBlank String token
) {}
