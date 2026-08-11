package to.bconnect.api.security.session;

public record NewDeviceLoginEvent(
        Long memberId,
        String phone
) { }
