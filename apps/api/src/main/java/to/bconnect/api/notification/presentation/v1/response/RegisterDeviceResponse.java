package to.bconnect.api.notification.presentation.v1.response;

public record RegisterDeviceResponse(boolean registered) {

    public static RegisterDeviceResponse ok() {
        return new RegisterDeviceResponse(true);
    }
}
