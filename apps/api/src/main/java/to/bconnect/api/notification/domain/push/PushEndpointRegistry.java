package to.bconnect.api.notification.domain.push;

public interface PushEndpointRegistry {

    String ensure(String token);

    void delete(String endpoint);
}
