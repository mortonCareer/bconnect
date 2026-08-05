package to.bconnect.api.notification.infrastructure;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.CreatePlatformEndpointRequest;
import software.amazon.awssdk.services.sns.model.DeleteEndpointRequest;
import software.amazon.awssdk.services.sns.model.InvalidParameterException;
import software.amazon.awssdk.services.sns.model.SetEndpointAttributesRequest;
import to.bconnect.api.notification.domain.push.PushEndpointRegistry;

import java.util.Map;
import java.util.regex.Pattern;

/**
 * References <br/>
 * - <a href="https://docs.aws.amazon.com/sns/latest/dg/mobile-platform-endpoint.html">Creating a platform endpoint</a> <br/>
 * - <a href="https://docs.aws.amazon.com/sns/latest/api/API_CreatePlatformEndpoint.html">API Reference : CreatePlatformEndpoint</a>
 */
@Component
@Profile({"prod", "dev"})
@RequiredArgsConstructor
public class SnsEndpointRegistry implements PushEndpointRegistry {

    private static final Pattern EXISTING_ARN = Pattern.compile("Endpoint (arn:aws:sns:\\S+) already exists");

    private final SnsClient snsClient;
    private final SnsProperties properties;

    @Override
    public String ensure(String token) {
        String endpoint;
        try {
            endpoint = snsClient.createPlatformEndpoint(
                    CreatePlatformEndpointRequest.builder()
                            .platformApplicationArn(properties.platformApplicationArn())
                            .token(token)
                            .build())
                    .endpointArn();
        } catch (InvalidParameterException e) {
            val matcher = EXISTING_ARN.matcher(e.getMessage());
            if (!matcher.find()) throw e;
            endpoint = matcher.group(1);
        }

        snsClient.setEndpointAttributes(SetEndpointAttributesRequest.builder()
                .endpointArn(endpoint)
                .attributes(Map.of("Token", token, "Enabled", "true"))
                .build());
        return endpoint;
    }

    @Override
    public void delete(String endpoint) {
        snsClient.deleteEndpoint(
                DeleteEndpointRequest.builder()
                        .endpointArn(endpoint)
                        .build());
    }
}
