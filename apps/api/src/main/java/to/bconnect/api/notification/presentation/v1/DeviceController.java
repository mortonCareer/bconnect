package to.bconnect.api.notification.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.notification.domain.DeviceService;
import to.bconnect.api.notification.presentation.v1.request.RegisterDeviceRequest;
import to.bconnect.api.notification.presentation.v1.request.UnregisterDeviceRequest;
import to.bconnect.api.notification.presentation.v1.response.RegisterDeviceResponse;
import to.bconnect.api.security.AuthUser;

@RestController
@RequestMapping("/api/v1/devices")
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceService deviceService;

    @PostMapping
    public ApiResponse<RegisterDeviceResponse> register(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid RegisterDeviceRequest request) {
        deviceService.register(user, request.token(), request.platform());
        return ApiResponse.success(RegisterDeviceResponse.ok());
    }

    @DeleteMapping
    public ApiResponse<Void> unregister(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid UnregisterDeviceRequest request) {
        deviceService.unregister(user, request.token());
        return ApiResponse.success(null);
    }
}
