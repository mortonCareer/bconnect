package to.bconnect.api.notification.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;

public record RegisterDeviceResponse(@Schema(requiredMode = Schema.RequiredMode.REQUIRED) boolean registered) {

    public static RegisterDeviceResponse ok() {
        return new RegisterDeviceResponse(true);
    }
}
