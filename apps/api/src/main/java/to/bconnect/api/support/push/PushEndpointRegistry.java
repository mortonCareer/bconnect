package to.bconnect.api.support.push;

public interface PushEndpointRegistry {

    String ensureEndpoint(String token);

    void deleteEndpoint(String endpointArn);
}
