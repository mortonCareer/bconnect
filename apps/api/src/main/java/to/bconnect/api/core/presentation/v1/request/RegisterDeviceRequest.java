package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import to.bconnect.api.storage.device.DevicePlatform;

public record RegisterDeviceRequest(
        @NotBlank String token,
        @NotNull DevicePlatform platform
) {}
