package to.bconnect.api.notification.domain.push;

public interface PushEndpointRegistry {

    String ensureEndpoint(String token);

    void deleteEndpoint(String endpointArn);
}
